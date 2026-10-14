import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { GET } from "@/app/api/gaming/teammates/route";

describe("CampusLoop Gaming Teammates API (/api/gaming/teammates)", () => {
  it("lists looking-for-team teammates with filtering capability", async () => {
    const req = new NextRequest("https://campusloop.space/api/gaming/teammates?limit=10");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.teammates).toBeDefined();
    expect(Array.isArray(json.teammates)).toBe(true);
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
