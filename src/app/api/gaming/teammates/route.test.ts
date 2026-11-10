import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
// Never touch a real database from unit tests.
vi.mock("@/db", async () =>
  (await import("@/test/mock-db")).mockDbModule({
    tables: {
      gamerProfiles: [
        {
          id: "gamer_test_1",
          userId: "prof_test_1",
          user: { id: "prof_test_1", username: "ace", displayName: "Ace", avatarUrl: null, points: 50 },
          institution: null,
          primaryGame: "Valorant",
          games: [{ name: "Valorant", gamerTag: "ace#0001", isHandlePublic: true }],
          platforms: ["PC"],
          playStyle: "COMPETITIVE",
          preferredAvailability: "EVENINGS",
          voicePreference: "VOICE",
          bio: "Looking for a duo",
          isHandlePublic: false,
          updatedAt: new Date(),
        },
      ],
    },
  }),
);

import { GET } from "@/app/api/gaming/teammates/route";

describe("CampusLoop Gaming Teammates API (/api/gaming/teammates)", () => {
  it("lists looking-for-team teammates with filtering capability", async () => {
    const req = new NextRequest("https://campusloop.space/api/gaming/teammates?limit=10");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.teammates).toBeDefined();
    expect(Array.isArray(json.teammates)).toBe(true);
    // Private gamer tags stay hidden from other students.
    expect(json.teammates[0].games[0].gamerTag).toBe("Protected Handle");
  });

  it("filters teammates by game and playStyle", async () => {
    const req = new NextRequest(
      "https://campusloop.space/api/gaming/teammates?game=Valorant&playStyle=COMPETITIVE"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.teammates)).toBe(true);
  });
});
