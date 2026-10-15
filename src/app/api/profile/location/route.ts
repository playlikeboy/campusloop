import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { clearLocation, getLocation, isValidPoint, readRequestGeo, saveGpsLocation } from "@/lib/geo/location";
import { invalidateViewerAffinity } from "@/lib/recommendations/viewer-affinity";

export const dynamic = "force-dynamic";

async function resolveProfileId(): Promise<string | null> {
  const user = await hexclaveServerApp.getUser();
  if (!user) return null;
  const profile = await getDb().query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
    columns: { id: true },
  });
  return profile?.id ?? null;
}

/** The viewer's own stored location: city and source only, plus whether precise GPS is on. */
export async function GET() {
  const profileId = await resolveProfileId();
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const loc = await getLocation(profileId);
  return NextResponse.json({
    location: loc
      ? { source: loc.source, city: loc.city, region: loc.region, country: loc.country, updatedAt: loc.updatedAt }
      : null,
  });
}

/** Opt-in precise location from navigator.geolocation. Rounded to ~1 km server-side. */
export async function POST(req: Request) {
  try {
    const profileId = await resolveProfileId();
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as {
      latitude?: unknown;
      longitude?: unknown;
      accuracy?: unknown;
    } | null;
    if (!isValidPoint(body?.latitude, body?.longitude)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    const accuracy = typeof body?.accuracy === "number" && Number.isFinite(body.accuracy) ? body.accuracy : null;

    await saveGpsLocation(
      profileId,
      { latitude: body?.latitude as number, longitude: body?.longitude as number, accuracyM: accuracy },
      readRequestGeo(req)
    );
    await invalidateViewerAffinity(profileId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/profile/location error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** Forget the stored location. City-level IP geo resumes on the next heartbeat. */
export async function DELETE() {
  const profileId = await resolveProfileId();
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearLocation(profileId);
  await invalidateViewerAffinity(profileId);
  return NextResponse.json({ ok: true });
}
