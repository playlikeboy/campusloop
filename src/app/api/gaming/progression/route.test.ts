import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { GET } from "@/app/api/gaming/progression/route";

describe("CampusLoop Gaming Progression API (/api/gaming/progression)", () => {
  it("returns seasonal leaderboard with rankings", async () => {
    const req = new NextRequest(
      "https://campusloop.space/api/gaming/progression?game=Valorant&season=2026-S1&scope=all"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.leaderboard).toBeDefined();
    expect(Array.isArray(json.leaderboard)).toBe(true);
    expect(json.season).toBe("2026-S1");
    expect(json.game).toBe("Valorant");
  });
});
