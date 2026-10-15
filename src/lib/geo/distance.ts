/**
 * Pure geo math, safe for client and server bundles.
 * Storage and privacy rules live in ./location.ts.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** ~1.1 km precision: enough for "nearby", useless for finding a room. */
export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isValidPoint(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/** Public-safe distance label. Never finer than the coordinate rounding. */
export function distanceBucketLabel(km: number | null | undefined): string | null {
  if (km === null || km === undefined || !Number.isFinite(km)) return null;
  if (km < 2) return "Within 2 km";
  if (km < 5) return "Within 5 km";
  if (km < 10) return "Within 10 km";
  if (km < 25) return "Within 25 km";
  if (km < 50) return "Within 50 km";
  if (km < 100) return "Within 100 km";
  return null;
}

/** Ranking multiplier from distance; neutral when unknown. */
export function proximityMultiplier(km: number | null | undefined): number {
  if (km === null || km === undefined || !Number.isFinite(km)) return 1;
  if (km < 5) return 1.15;
  if (km < 25) return 1.08;
  if (km < 100) return 1.03;
  if (km > 800) return 0.92;
  return 1;
}
