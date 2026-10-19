import { describe, expect, it } from "vitest";
import { distanceBucketLabel, haversineKm, isValidPoint, proximityMultiplier, roundCoord } from "./distance";

describe("geo distance", () => {
  it("haversine matches a known distance (Ranchi to Delhi ~ 1000 km)", () => {
    const km = haversineKm({ latitude: 23.34, longitude: 85.31 }, { latitude: 28.61, longitude: 77.21 });
    expect(km).toBeGreaterThan(950);
    expect(km).toBeLessThan(1050);
  });

  it("rounds to 2 decimals (~1 km grid)", () => {
    expect(roundCoord(23.412345)).toBe(23.41);
    expect(roundCoord(-77.2099)).toBe(-77.21);
  });

  it("rejects invalid and null-island points", () => {
    expect(isValidPoint(0, 0)).toBe(false);
    expect(isValidPoint(91, 10)).toBe(false);
    expect(isValidPoint("23", 85)).toBe(false);
    expect(isValidPoint(23.3, 85.3)).toBe(true);
  });

  it("only exposes coarse buckets and hides far distances", () => {
    expect(distanceBucketLabel(0.4)).toBe("Within 2 km");
    expect(distanceBucketLabel(12)).toBe("Within 25 km");
    expect(distanceBucketLabel(300)).toBeNull();
    expect(distanceBucketLabel(null)).toBeNull();
  });

  it("proximity multiplier favours near, is neutral when unknown", () => {
    expect(proximityMultiplier(2)).toBeGreaterThan(proximityMultiplier(50));
    expect(proximityMultiplier(undefined)).toBe(1);
    expect(proximityMultiplier(2000)).toBeLessThan(1);
  });
});
