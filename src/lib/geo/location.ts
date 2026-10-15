import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, between, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { userLocations, userProfiles } from "@/db/schema";
import { type GeoPoint, haversineKm, isValidPoint, roundCoord } from "./distance";

export * from "./distance";

/**
 * Student location: the only module that reads or writes `user_locations`.
 *
 * Privacy rules enforced here:
 * - GPS is opt-in and rounded to 2 decimals (~1.1 km) before it is stored.
 * - Other students only ever get a distance bucket ("Within 5 km"), never coordinates.
 * - A recent GPS fix (< 7 days) is never overwritten by coarser IP geo.
 */

export interface RequestGeo {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

const IP_REFRESH_HOURS = 6;
const GPS_STICKY_DAYS = 7;

function parseNum(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseFloat(v) : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

/** City-level geo from Cloudflare (request.cf, falling back to visitor-location headers). */
export function readRequestGeo(req?: Request): RequestGeo {
  let cf: Record<string, unknown> | undefined;
  try {
    cf = getCloudflareContext().cf as Record<string, unknown> | undefined;
  } catch {
    // Outside a Workers request (tests, local node)
  }
  const h = (name: string) => req?.headers.get(name) || null;
  const decode = (v: string | null) => {
    if (!v) return null;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  return {
    country: (cf?.country as string) || h("cf-ipcountry"),
    region: (cf?.region as string) || decode(h("cf-region")),
    city: (cf?.city as string) || decode(h("cf-ipcity")),
    latitude: parseNum(cf?.latitude) ?? parseNum(h("cf-iplatitude")),
    longitude: parseNum(cf?.longitude) ?? parseNum(h("cf-iplongitude")),
  };
}

/** Throttled IP-geo refresh; called from the presence heartbeat. */
export async function recordIpLocation(profileId: string, geo: RequestGeo): Promise<void> {
  if (!geo.country && !geo.city) return;
  const hasPoint = isValidPoint(geo.latitude, geo.longitude);
  const values = {
    profileId,
    source: "IP",
    country: geo.country,
    region: geo.region,
    city: geo.city,
    latitude: hasPoint ? roundCoord(geo.latitude as number) : null,
    longitude: hasPoint ? roundCoord(geo.longitude as number) : null,
    accuracyM: hasPoint ? 25_000 : null,
    updatedAt: new Date(),
  };
  const db = getDb();
  await db
    .insert(userLocations)
    .values(values)
    .onConflictDoUpdate({
      target: userLocations.profileId,
      set: {
        source: values.source,
        country: values.country,
        region: values.region,
        city: values.city,
        latitude: values.latitude,
        longitude: values.longitude,
        accuracyM: values.accuracyM,
        updatedAt: values.updatedAt,
      },
      setWhere: sql`${userLocations.updatedAt} < now() - (${IP_REFRESH_HOURS} * interval '1 hour')
        and (${userLocations.gpsUpdatedAt} is null or ${userLocations.gpsUpdatedAt} < now() - (${GPS_STICKY_DAYS} * interval '1 day'))`,
    });
}

/** Opt-in precise location from the browser, rounded before storage. */
export async function saveGpsLocation(
  profileId: string,
  point: GeoPoint & { accuracyM?: number | null },
  ipGeo?: RequestGeo
): Promise<void> {
  const now = new Date();
  const values = {
    profileId,
    source: "GPS",
    country: ipGeo?.country ?? null,
    region: ipGeo?.region ?? null,
    city: ipGeo?.city ?? null,
    latitude: roundCoord(point.latitude),
    longitude: roundCoord(point.longitude),
    // Never claim better than the rounding grid.
    accuracyM: Math.max(1100, Math.round(point.accuracyM ?? 1100)),
    gpsUpdatedAt: now,
    updatedAt: now,
  };
  const { profileId: _pk, ...set } = values;
  await getDb().insert(userLocations).values(values).onConflictDoUpdate({ target: userLocations.profileId, set });
}

export async function clearLocation(profileId: string): Promise<void> {
  await getDb().delete(userLocations).where(eq(userLocations.profileId, profileId));
}

export async function getLocation(profileId?: string | null) {
  if (!profileId) return null;
  try {
    const row = await getDb().query.userLocations.findFirst({ where: eq(userLocations.profileId, profileId) });
    return row ?? null;
  } catch {
    return null;
  }
}

/** Coordinates for a batch of profiles, for server-side distance ranking only. */
export async function getPointsFor(profileIds: string[]): Promise<Map<string, GeoPoint>> {
  const out = new Map<string, GeoPoint>();
  if (profileIds.length === 0) return out;
  try {
    const rows = await getDb()
      .select({ id: userLocations.profileId, lat: userLocations.latitude, lng: userLocations.longitude })
      .from(userLocations)
      .where(and(inArray(userLocations.profileId, profileIds), isNotNull(userLocations.latitude)));
    for (const r of rows) {
      if (isValidPoint(r.lat, r.lng)) out.set(r.id, { latitude: r.lat as number, longitude: r.lng as number });
    }
  } catch {
    // Location is an enhancement; ranking proceeds without it.
  }
  return out;
}

/**
 * Campuses with active students near a point, nearest first. Bounding-box
 * prefilter on the lat/lng index, exact haversine in JS.
 */
export async function getNearbyInstitutionIds(
  point: GeoPoint,
  opts: { radiusKm?: number; excludeInstitutionId?: string | null; limit?: number } = {}
): Promise<string[]> {
  const radiusKm = opts.radiusKm ?? 40;
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(0.2, Math.cos((point.latitude * Math.PI) / 180)));
  try {
    const rows = await getDb()
      .select({
        institutionId: userProfiles.institutionId,
        lat: userLocations.latitude,
        lng: userLocations.longitude,
      })
      .from(userLocations)
      .innerJoin(userProfiles, eq(userProfiles.id, userLocations.profileId))
      .where(
        and(
          between(userLocations.latitude, point.latitude - dLat, point.latitude + dLat),
          between(userLocations.longitude, point.longitude - dLng, point.longitude + dLng),
          opts.excludeInstitutionId ? ne(userProfiles.institutionId, opts.excludeInstitutionId) : undefined
        )
      )
      .limit(500);

    const best = new Map<string, number>();
    for (const r of rows) {
      if (!r.institutionId || !isValidPoint(r.lat, r.lng)) continue;
      const km = haversineKm(point, { latitude: r.lat as number, longitude: r.lng as number });
      if (km > radiusKm) continue;
      best.set(r.institutionId, Math.min(best.get(r.institutionId) ?? Number.POSITIVE_INFINITY, km));
    }
    return [...best.entries()]
      .sort((a, b) => a[1] - b[1])
      .slice(0, opts.limit ?? 15)
      .map(([id]) => id);
  } catch {
    return [];
  }
}
