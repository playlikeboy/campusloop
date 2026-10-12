import { describe, expect, it } from "vitest";
import { DELETE, GET, OPTIONS, POST, PUT } from "./route";

const TEST_API_KEY = "test_academics_api_key_2026";
process.env.MCP_ACADEMICS_API_KEY = TEST_API_KEY;

describe("CampusLoop MCP Academics Vault Engine (/mcp/academics)", () => {
  it("handles OPTIONS request with correct CORS headers", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("GET");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });

  it("responds to standard MCP ping requests", async () => {
    const pingReq = new Request("https://campusloop.space/mcp/academics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "ping-1", method: "ping" }),
    });

    const res = await POST(pingReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe("ping-1");
  });

  it("acknowledges notifications/initialized with an empty 202 response", async () => {
    const initNoticeReq = new Request("https://campusloop.space/mcp/academics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    });

    const res = await POST(initNoticeReq);
    expect(res.status).toBe(202);
  });

  it("allows unauthenticated GET requests to list resources & tools schema", async () => {
    const req = new Request("https://campusloop.space/mcp/academics?limit=5", {
      headers: { Accept: "application/json" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.openapi).toBe("3.1.0");
    expect(Array.isArray(data.tools)).toBe(true);
    expect(data.tools.length).toBeGreaterThanOrEqual(8);
    expect(Array.isArray(data.resources)).toBe(true);
    expect(data.metrics.authenticated).toBe(false);
  });

  it("identifies authenticated GET requests when valid apikey query param is present", async () => {
    const req = new Request(
      `https://campusloop.space/mcp/academics?apikey=${TEST_API_KEY}&limit=5`,
      { headers: { Accept: "application/json" } }
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.metrics.authenticated).toBe(true);
  });

  it("renders rich HTML documentation for browser visits without API key", async () => {
    const req = new Request("https://campusloop.space/mcp/academics", {
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("Academic Vault & Notes MCP Engine");
    expect(html).toContain("list_academic_resources");
  });

  it("rejects unauthenticated REST POST resource creation with 401", async () => {
    const req = new Request("https://campusloop.space/mcp/academics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Unauthorized Notes",
        subjectCode: "CS101",
        subjectName: "Intro to CS",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Unauthorized");
  });

  it("handles Model Context Protocol (MCP) JSON-RPC initialize and tools/list", async () => {
    const initReq = new Request("https://campusloop.space/mcp/academics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "initialize",
        params: { protocolVersion: "2024-11-05" },
      }),
    });
    const initRes = await POST(initReq);
    expect(initRes.status).toBe(200);
    const initData = await initRes.json();
    expect(initData.result.serverInfo.name).toBe("campusloop-academics-mcp");

    const toolsReq = new Request("https://campusloop.space/mcp/academics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "2",
        method: "tools/list",
      }),
    });
    const toolsRes = await POST(toolsReq);
    expect(toolsRes.status).toBe(200);
    const toolsData = await toolsRes.json();
    expect(Array.isArray(toolsData.result.tools)).toBe(true);
    const toolNames = toolsData.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain("list_academic_resources");
    expect(toolNames).toContain("create_academic_resource");
    expect(toolNames).toContain("create_academic_playlist");
    expect(toolNames).toContain("manage_playlist_item");
  });

  it("exposes OpenAPI 3.1.0 specification with paths and tools for Composio import", async () => {
    const req = new Request(
      `https://campusloop.space/mcp/academics?apikey=${TEST_API_KEY}`,
      { headers: { Accept: "application/json" } }
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.openapi).toBe("3.1.0");
    expect(data.paths["/mcp/academics"]).toBeDefined();
    expect(data.paths["/mcp/academics"].get.operationId).toBe("list_academic_resources");
    expect(data.paths["/mcp/academics"].post.operationId).toBe("create_academic_resource");
    expect(data.paths["/mcp/academics"].put.operationId).toBe("update_academic_resource");
    expect(data.paths["/mcp/academics"].delete.operationId).toBe("delete_academic_resource");
  });

  it("handles MCP SSE streaming when text/event-stream is requested", async () => {
    const req = new Request("https://campusloop.space/mcp/academics", {
      headers: { Accept: "text/event-stream" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });
});
