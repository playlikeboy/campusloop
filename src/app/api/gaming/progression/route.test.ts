import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
// Never touch a real database from unit tests.
vi.mock("@/db", async () =>
  (await import("@/test/mock-db")).mockDbModule({
    tables: {
      gamingProgression: [
        {
          id: "prog_test_1",
          userId: "prof_test_1",
          user: { id: "prof_test_1", username: "ace", displayName: "Ace", avatarUrl: null, points: 50 },
          institution: null,
          gameName: "Valorant",
          season: "2026-S1",
          rankingPoints: 1200,
          matchesPlayed: 10,
          matchesWon: 7,
          tournamentsWon: 1,
          fairPlayHonors: 2,
        },
      ],
    },
  }),
);

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
