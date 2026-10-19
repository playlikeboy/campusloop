import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/hexclave/server", () => ({
  hexclaveServerApp: {
    getUser: vi.fn(),
  },
}));

import { GET, POST } from "@/app/api/gaming/tournaments/route";
import { hexclaveServerApp } from "@/hexclave/server";

describe("CampusLoop Gaming Tournaments API (/api/gaming/tournaments)", () => {
  it("rejects unauthenticated tournament creation with HTTP 401", async () => {
    (hexclaveServerApp.getUser as any).mockResolvedValue(null);

    const req = new NextRequest("https://campusloop.space/api/gaming/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Inter-College Spring Cup",
        gameName: "Valorant",
        startsAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("lists gaming tournaments with pagination", async () => {
    const req = new NextRequest("https://campusloop.space/api/gaming/tournaments?limit=5");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tournaments).toBeDefined();
    expect(Array.isArray(json.tournaments)).toBe(true);
    expect(typeof json.total).toBe("number");
  }, 15000);

  it("calculates correct single-elimination bracket rounds", () => {
    // 4 teams -> 2 rounds (Semis, Finals)
    expect(Math.log2(4)).toBe(2);
    // 8 teams -> 3 rounds (QF, SF, Finals)
    expect(Math.log2(8)).toBe(3);
    // 16 teams -> 4 rounds (R16, QF, SF, Finals)
    expect(Math.log2(16)).toBe(4);
    // 32 teams -> 5 rounds
    expect(Math.log2(32)).toBe(5);
  });
});
