import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/hexclave/server", () => ({
  hexclaveServerApp: {
    getUser: vi.fn(),
  },
}));

import { GET, POST } from "@/app/api/gaming/lobbies/route";
import { hexclaveServerApp } from "@/hexclave/server";

describe("CampusLoop Gaming Lobbies API (/api/gaming/lobbies)", () => {
  it("rejects unauthenticated lobby creation with HTTP 401", async () => {
    (hexclaveServerApp.getUser as any).mockResolvedValue(null);

    const req = new NextRequest("https://campusloop.space/api/gaming/lobbies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Unauthorized 5v5 Valorant Scrim",
        gameName: "Valorant",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("lists gaming lobbies with pagination and total count", async () => {
    const req = new NextRequest("https://campusloop.space/api/gaming/lobbies?limit=10&page=1");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toBeDefined();
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(10);
    expect(typeof json.total).toBe("number");
  });

  it("filters lobbies by game and mode without error", async () => {
    const req = new NextRequest(
      "https://campusloop.space/api/gaming/lobbies?game=Valorant&mode=5V5&scope=all"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.items)).toBe(true);
  });

  it("filters lobbies by search query", async () => {
    const req = new NextRequest(
      "https://campusloop.space/api/gaming/lobbies?q=Scrim"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.items)).toBe(true);
  });
});
