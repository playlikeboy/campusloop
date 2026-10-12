import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, OPTIONS, PATCH, POST, PUT } from "./route";

// Mock the database layer to test the route logic cleanly and reliably
vi.mock("@/db", () => {
  const sampleEvents = [
    {
      id: "event_remote_101",
      slug: "remote-ai-hackathon-abc123",
      title: "Remote AI Hackathon",
      tagline: "Build with LLMs",
      description: "Join developers across India for 48 hours of building.",
      clubName: "CampusLoop Spotlight",
      eventType: "HACKATHON",
      mode: "ONLINE",
      meetingUrl: "https://devfolio.co/ai-hack",
      startDate: new Date("2026-11-01T10:00:00Z"),
      endDate: new Date("2026-11-03T18:00:00Z"),
      registrationDeadline: new Date("2026-10-31T23:59:59Z"),
      participationType: "SOLO",
      minTeamSize: 1,
      maxTeamSize: 4,
      isPaid: false,
      entryFee: "Free",
      prizesDescription: "₹1,00,000 in cash prizes",
      perks: ["Prizes", "Certificates", "Loop Points"],
      loopPointsReward: 30,
      status: "PUBLISHED",
      visibility: "PUBLIC",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return {
    getDb: vi.fn(() => ({
      query: {
        events: {
          findMany: vi.fn(async () => sampleEvents),
          findFirst: vi.fn(async ({ where }: any) => sampleEvents[0]),
        },
        institutions: {
          findFirst: vi.fn(async () => ({ id: "inst_test_1" })),
        },
        userProfiles: {
          findFirst: vi.fn(async () => ({ id: "prof_test_1", institutionId: "inst_test_1" })),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn((data: any) => ({
          returning: vi.fn(async () => [
            {
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn((data: any) => ({
          where: vi.fn(() => ({
            returning: vi.fn(async () => [
              {
                ...sampleEvents[0],
                ...data,
                updatedAt: new Date(),
              },
            ]),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(async () => {}),
      })),
    })),
  };
});

describe("CampusLoop MCP Events Engine (/mcp/events)", () => {
  const TEST_API_KEY = "test_super_secret_mcp_key_123";

  beforeEach(() => {
    process.env.MCP_EVENTS_API_KEY = TEST_API_KEY;
  });

  it("handles OPTIONS request with correct CORS headers", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
    expect(res.headers.get("access-control-allow-headers")).toContain("MCP-Protocol-Version");
    expect(res.headers.get("access-control-allow-headers")).toContain("MCP-Session-Id");
  });

  it("acknowledges notifications/initialized with an empty 202 response", async () => {
    const req = new Request("https://campusloop.space/mcp/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });

  it("responds to standard MCP ping requests", async () => {
    const req = new Request("https://campusloop.space/mcp/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 12, method: "ping", params: {} }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ jsonrpc: "2.0", id: 12, result: {} });
  });

  it("allows unauthenticated GET requests to list events & tools schema", async () => {
    const req = new Request("https://campusloop.space/mcp/events?format=json", {
      headers: { accept: "application/json" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.mcp.name).toBe("campusloop-events-mcp");
    expect(data.mcp.auth.authenticated).toBe(false);
    expect(Array.isArray(data.tools)).toBe(true);
    expect(data.tools.some((t: any) => t.name === "create_remote_event")).toBe(true);
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeGreaterThan(0);
  });

  it("identifies authenticated GET requests when valid apikey query param is present", async () => {
    const req = new Request(`https://campusloop.space/mcp/events?format=json&apikey=${TEST_API_KEY}`, {
      headers: { accept: "application/json" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.mcp.auth.authenticated).toBe(true);
  });

  it("accepts any valid auth source when another supplied source is stale", async () => {
    const req = new Request(
      `https://campusloop.space/mcp/events?format=json&apikey=stale-test-key`,
      {
        headers: {
          accept: "application/json",
          "x-api-key": TEST_API_KEY,
        },
      }
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.mcp.auth.authenticated).toBe(true);
  });

  it("renders rich HTML documentation for browser visits", async () => {
    const req = new Request("https://campusloop.space/mcp/events", {
      headers: { accept: "text/html,application/xhtml+xml" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const html = await res.text();
    expect(html).toContain("CampusLoop Events MCP");
    expect(html).toContain("Model Context Protocol");
    expect(html).toContain("create_remote_event");
  });

  it("rejects unauthenticated REST POST event creation with 401", async () => {
    const req = new Request("https://campusloop.space/mcp/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Unauthorized Event",
        description: "Should fail without key",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toContain("Unauthorized");
  });

  it("successfully creates remote opportunity with valid apikey query param", async () => {
    const req = new Request(`https://campusloop.space/mcp/events?apikey=${TEST_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "National Student AI Fellowship 2026",
        description: "Fully remote 8-week engineering fellowship with stipends.",
        clubName: "CampusLoop Grants",
        eventType: "COMPETITION",
        mode: "ONLINE",
        externalUrl: "https://campusloop.space/fellowship",
        prizesDescription: "₹5,00,000 grant pool",
        perks: ["Stipend", "Mentorship", "Certificates"],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.event.title).toBe("National Student AI Fellowship 2026");
    expect(data.event.isRemote).toBe(true);
    expect(data.urls.public).toContain("https://campusloop.space/events/");
  });

  it("handles Model Context Protocol (MCP) JSON-RPC initialize and tools/list", async () => {
    // 1. initialize
    const initReq = new Request("https://campusloop.space/mcp/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
      }),
    });
    const initRes = await POST(initReq);
    expect(initRes.status).toBe(200);
    const initData = await initRes.json();
    expect(initData.result.serverInfo.name).toBe("campusloop-events-mcp");

    // 2. tools/list
    const toolsReq = new Request("https://campusloop.space/mcp/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      }),
    });
    const toolsRes = await POST(toolsReq);
    expect(toolsRes.status).toBe(200);
    const toolsData = await toolsRes.json();
    expect(Array.isArray(toolsData.result.tools)).toBe(true);
  });

  it("supports authenticated MCP update_event and delete_event tool calls", async () => {
    const updateReq = new Request(`https://campusloop.space/mcp/events?apikey=${TEST_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "update_event_test",
        method: "tools/call",
        params: {
          name: "update_event",
          arguments: {
            idOrSlug: "remote-ai-hackathon-abc123",
            title: "MCP Updated AI Hackathon",
            status: "DRAFT",
          },
        },
      }),
    });
    const updateRes = await POST(updateReq);
    expect(updateRes.status).toBe(200);
    const updateData = await updateRes.json();
    expect(updateData.result.isError).toBeUndefined();
    expect(updateData.result.content[0].text).toContain("MCP Updated AI Hackathon");

    const deleteReq = new Request(`https://campusloop.space/mcp/events?apikey=${TEST_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "delete_event_test",
        method: "tools/call",
        params: {
          name: "delete_event",
          arguments: { idOrSlug: "remote-ai-hackathon-abc123" },
        },
      }),
    });
    const deleteRes = await POST(deleteReq);
    expect(deleteRes.status).toBe(200);
    const deleteData = await deleteRes.json();
    expect(deleteData.result.isError).toBeUndefined();
    expect(deleteData.result.content[0].text).toContain("deleted");
  });

  it("blocks MCP mutation tools when unauthenticated and executes when authenticated", async () => {
    // Unauthenticated tools/call for mutation
    const unauthReq = new Request("https://campusloop.space/mcp/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "create_remote_event",
          arguments: {
            title: "Remote Code Sprint",
            description: "Test Sprint",
          },
        },
      }),
    });
    const unauthRes = await POST(unauthReq);
    const unauthData = await unauthRes.json();
    expect(unauthData.result.isError).toBe(true);

    // Authenticated tools/call with header
    const authReq = new Request("https://campusloop.space/mcp/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TEST_API_KEY,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "create_remote_event",
          arguments: {
            title: "Remote Code Sprint",
            description: "Authorized sprint via MCP",
          },
        },
      }),
    });
    const authRes = await POST(authReq);
    const authData = await authRes.json();
    expect(authData.result.isError).toBeUndefined();
    expect(authData.result.content[0].text).toContain("Remote Code Sprint");
  });

  it("supports authenticated PUT updates and DELETE removals", async () => {
    // PUT update
    const putReq = new Request(`https://campusloop.space/mcp/events?apikey=${TEST_API_KEY}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idOrSlug: "remote-ai-hackathon-abc123",
        title: "Updated AI Hackathon Title",
      }),
    });
    const putRes = await PUT(putReq);
    expect(putRes.status).toBe(200);
    const putData = await putRes.json();
    expect(putData.success).toBe(true);

    // DELETE removal
    const delReq = new Request(`https://campusloop.space/mcp/events?id=event_remote_101&apikey=${TEST_API_KEY}`, {
      method: "DELETE",
    });
    const delRes = await DELETE(delReq);
    expect(delRes.status).toBe(200);
    const delData = await delRes.json();
    expect(delData.success).toBe(true);
  });

  it("exposes OpenAPI 3.1.0 specification with paths and tools for Composio import", async () => {
    const req = new Request(`https://campusloop.space/mcp/events?apikey=${TEST_API_KEY}`);
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.openapi).toBe("3.1.0");
    expect(data.paths).toBeDefined();
    expect(data.paths["/mcp/events"].get.operationId).toBe("list_events");
    expect(data.paths["/mcp/events"].post.operationId).toBe("create_remote_event");
    expect(data.paths["/mcp/events"].put.operationId).toBe("update_event");
    expect(data.paths["/mcp/events"].delete.operationId).toBe("delete_event");
    expect(Array.isArray(data.functions)).toBe(true);
    expect(Array.isArray(data.result.tools)).toBe(true);
  });

  it("handles MCP SSE streaming when text/event-stream is requested", async () => {
    const sseReq = new Request(`https://campusloop.space/mcp/events?apikey=${TEST_API_KEY}`, {
      headers: { accept: "text/event-stream" },
    });
    const sseRes = await GET(sseReq);
    expect(sseRes.status).toBe(200);
    expect(sseRes.headers.get("content-type")).toContain("text/event-stream");
  });
});
