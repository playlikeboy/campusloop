import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { GET, OPTIONS, POST } from "@/app/mcp/articles/route";
import { GET as getOpenApi } from "@/app/mcp/articles/openapi.json/route";

const VALID_API_KEY = process.env.MCP_ARTICLES_API_KEY || process.env.MCP_API_KEY || "HBEifejbwhfbiaqDQHW";
process.env.MCP_ARTICLES_API_KEY = VALID_API_KEY;

describe("CampusLoop Articles MCP Engine (/mcp/articles)", () => {
  describe("CORS & Preflight Handling", () => {
    it("responds to OPTIONS with 204 and CORS headers", async () => {
      const req = new NextRequest("https://campusloop.space/mcp/articles", {
        method: "OPTIONS",
      });
      const res = await OPTIONS(req);
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
      expect(res.headers.get("access-control-allow-methods")).toContain("POST");
      expect(res.headers.get("access-control-allow-headers")).toContain("x-api-key");
    });
  });

  describe("Authentication Mechanisms", () => {
    it("rejects unauthorized REST POST creation requests with HTTP 401", async () => {
      const req = new NextRequest("https://campusloop.space/mcp/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Unauthorized Draft",
          content: "Content that should be blocked without valid API key",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("rejects unauthorized JSON-RPC mutation tools with HTTP 401", async () => {
      const req = new NextRequest("https://campusloop.space/mcp/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "create_article",
            arguments: { title: "Hacked Post", content: "Malicious payload" },
          },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(-32001);
    });

    it("authenticates via ?apikey= query param", async () => {
      const req = new NextRequest(`https://campusloop.space/mcp/articles?apikey=${VALID_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.result?.tools).toBeDefined();
      expect(Array.isArray(json.result.tools)).toBe(true);
    });

    it("authenticates via x-api-key header", async () => {
      const req = new NextRequest("https://campusloop.space/mcp/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": VALID_API_KEY,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/list",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.result?.tools).toBeDefined();
    });

    it("authenticates via Authorization: Bearer header", async () => {
      const req = new NextRequest("https://campusloop.space/mcp/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_API_KEY}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 4,
          method: "ping",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.result).toEqual({});
    });
  });

  describe("OpenAPI 3.1.0 Endpoint", () => {
    it("returns valid OpenAPI 3.1.0 document with security and paths", async () => {
      const req = new NextRequest("https://campusloop.space/mcp/articles/openapi.json");
      const res = await getOpenApi(req);
      expect(res.status).toBe(200);
      const doc = await res.json();
      expect(doc.openapi).toBe("3.1.0");
      expect(doc.info.title).toContain("CampusLoop Articles");
      expect(doc.servers.length).toBeGreaterThan(0);
      expect(doc.paths["/mcp/articles"]).toBeDefined();
      expect(doc.components.securitySchemes.ApiKeyQuery).toBeDefined();
      expect(doc.components.securitySchemes.ApiKeyHeader).toBeDefined();
      expect(doc.components.securitySchemes.BearerAuth).toBeDefined();
    });
  });

  describe("JSON-RPC 2.0 Protocol & Handshake", () => {
    it("handles 'initialize' method correctly", async () => {
      const req = new NextRequest(`https://campusloop.space/mcp/articles?apikey=${VALID_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 10,
          method: "initialize",
          params: { clientInfo: { name: "AntigravityTest", version: "1.0.0" } },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.result.protocolVersion).toBe("2024-11-05");
      expect(json.result.serverInfo.name).toBe("campusloop-articles-mcp");
      expect(json.result.capabilities.tools).toBeDefined();
    });

    it("handles 'notifications/initialized'", async () => {
      const req = new NextRequest(`https://campusloop.space/mcp/articles?apikey=${VALID_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(202);
    });

    it("lists all registered tools with required schemas", async () => {
      const req = new NextRequest(`https://campusloop.space/mcp/articles?apikey=${VALID_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 12,
          method: "tools/list",
        }),
      });
      const res = await POST(req);
      const json = await res.json();
      const tools = json.result.tools;
      expect(tools.length).toBeGreaterThanOrEqual(40);

      const toolNames = tools.map((t: any) => t.name);
      expect(toolNames).toContain("list_articles");
      expect(toolNames).toContain("get_article");
      expect(toolNames).toContain("search_articles");
      expect(toolNames).toContain("create_article");
      expect(toolNames).toContain("update_article");
      expect(toolNames).toContain("delete_article");
      expect(toolNames).toContain("publish_article");
      expect(toolNames).toContain("list_categories");
      expect(toolNames).toContain("list_tags");
      expect(toolNames).toContain("list_demo_accounts");
      expect(toolNames).toContain("get_articles_metadata");
    });
  });

  describe("Tool Execution (tools/call)", () => {
    it("calls list_categories tool successfully", async () => {
      const req = new NextRequest(`https://campusloop.space/mcp/articles?apikey=${VALID_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 20,
          method: "tools/call",
          params: {
            name: "list_categories",
            arguments: {},
          },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.result).toBeDefined();
      expect(json.result.content[0].type).toBe("text");
      const parsed = JSON.parse(json.result.content[0].text);
      expect(parsed.count).toBeGreaterThanOrEqual(38);
      expect(Array.isArray(parsed.categories)).toBe(true);
    });

    it("calls list_demo_accounts tool successfully", async () => {
      const req = new NextRequest(`https://campusloop.space/mcp/articles?apikey=${VALID_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 21,
          method: "tools/call",
          params: {
            name: "list_demo_accounts",
            arguments: { limit: 10 },
          },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      const parsed = JSON.parse(json.result.content[0].text);
      expect(Array.isArray(parsed.authors)).toBe(true);
      expect(parsed.count).toBeGreaterThanOrEqual(1);
    });

    it("calls list_articles with pagination parameters", async () => {
      const req = new NextRequest(`https://campusloop.space/mcp/articles?apikey=${VALID_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 22,
          method: "tools/call",
          params: {
            name: "list_articles",
            arguments: { limit: 5, status: "PUBLISHED" },
          },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      const parsed = JSON.parse(json.result.content[0].text);
      expect(Array.isArray(parsed.articles)).toBe(true);
      expect(parsed.limit).toBe(5);
    });

    it("calls get_articles_metadata", async () => {
      const req = new NextRequest(`https://campusloop.space/mcp/articles?apikey=${VALID_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 23,
          method: "tools/call",
          params: {
            name: "get_articles_metadata",
            arguments: {},
          },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      const parsed = JSON.parse(json.result.content[0].text);
      expect(parsed.totalArticles).toBeDefined();
      expect(parsed.categoryBreakdown).toBeDefined();
    });
  });

  describe("HTML & REST Discovery (GET /mcp/articles)", () => {
    it("renders HTML documentation when Accept header contains text/html", async () => {
      const req = new NextRequest("https://campusloop.space/mcp/articles", {
        method: "GET",
        headers: { Accept: "text/html" },
      });
      const res = await GET(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");
      const html = await res.text();
      expect(html).toContain("CampusLoop Articles MCP Engine");
      expect(html).toContain("Curated Categories");
    });

    it("returns JSON article listing and manifest when Accept header is application/json", async () => {
      const req = new NextRequest(`https://campusloop.space/mcp/articles?apikey=${VALID_API_KEY}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.authenticated).toBe(true);
      expect(Array.isArray(json.articles)).toBe(true);
      expect(Array.isArray(json.tools)).toBe(true);
      expect(json.tools.length).toBeGreaterThanOrEqual(40);
    });
  });
});
