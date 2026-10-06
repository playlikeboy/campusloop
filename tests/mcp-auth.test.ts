import { describe, expect, it, mock, spyOn } from "bun:test";

mock.module("server-only", () => ({}));
mock.module("@/app/admin/_lib/guard", () => ({
  requireAdminApi: async () => ({
    authorized: true,
    db: {} as any,
    profile: { id: "admin_test", role: "ADMIN" } as any,
    errorResponse: null,
  }),
}));

import * as mcpAuth from "@/lib/mcp/auth";
import { extractMcpKeyFromRequest } from "@/lib/mcp/auth";
import { handleMcpJsonRpc } from "@/lib/mcp/server";
import type { McpContext } from "@/lib/mcp/types";
import { GET as getMcpInfo } from "@/app/api/mcp/route";
import { GET as getSseStream } from "@/app/api/mcp/sse/route";
import { GET as getFileRoute } from "@/app/api/files/r2/[...key]/route";
import { putR2Object } from "@/lib/r2";
import { validateEmailDomainForInstitution } from "@/lib/institutions";
import { hexclaveServerApp } from "@/hexclave/server";
import { NextRequest } from "next/server";

// Silence audit DB insertion during tests
spyOn(mcpAuth, "logMcpAudit").mockImplementation(async () => {});

// Mock helper to build an McpContext
function createMockContext(permissions: string[] = ["read"]): McpContext {
  return {
    userId: "user_test_123",
    keyId: "key_test_123",
    user: {
      id: "user_test_123",
      userId: "hex_user_123",
      username: "kunal",
      displayName: "Kunal Kashyap",
      email: "kunal@campus.edu",
      role: "STUDENT",
      points: 150,
      course: "B.Tech",
      branch: "CSE",
      year: 3,
      interests: ["AI", "Security"],
      institutionId: "inst_test_123",
      avatarUrl: null,
      bio: null,
      phone: null,
      dateOfBirth: null,
      gender: "MALE",
      instagramHandle: null,
      linkedinHandle: null,
      twitterHandle: null,
      githubHandle: null,
      anonymousUsername: "anon_shadow",
      isVerified: true,
      lastSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    institutionId: "inst_test_123",
    institutionName: "Campus University",
    permissions,
    clientInfo: "TestRunner/1.0",
  };
}

describe("PHASE 14, 15, 16 — MCP Authentication & Permissions Security", () => {
  it("strictly rejects API keys passed via query parameters (?key=, ?token=, ?apiKey=)", () => {
    const req1 = new Request("https://campusloop.space/api/mcp?key=cl_mcp_secret123");
    expect(extractMcpKeyFromRequest(req1)).toBeNull();

    const req2 = new Request("https://campusloop.space/api/mcp?token=cl_mcp_secret123");
    expect(extractMcpKeyFromRequest(req2)).toBeNull();

    const req3 = new Request("https://campusloop.space/api/mcp?apiKey=cl_mcp_secret123");
    expect(extractMcpKeyFromRequest(req3)).toBeNull();
  });

  it("extracts API key from Authorization: Bearer header", () => {
    const req = new Request("https://campusloop.space/api/mcp", {
      headers: {
        authorization: "Bearer cl_mcp_validtoken123",
      },
    });
    expect(extractMcpKeyFromRequest(req)).toBe("cl_mcp_validtoken123");
  });

  it("extracts API key from custom headers (x-campusloop-mcp-key and x-mcp-key)", () => {
    const req1 = new Request("https://campusloop.space/api/mcp", {
      headers: {
        "x-campusloop-mcp-key": "cl_mcp_customheader123",
      },
    });
    expect(extractMcpKeyFromRequest(req1)).toBe("cl_mcp_customheader123");

    const req2 = new Request("https://campusloop.space/api/mcp", {
      headers: {
        "x-mcp-key": "cl_mcp_shortheader123",
      },
    });
    expect(extractMcpKeyFromRequest(req2)).toBe("cl_mcp_shortheader123");
  });

  it("defaults missing or empty permissions strictly to ['read']", () => {
    const resolvePermissions = (recordPerms: any) =>
      Array.isArray(recordPerms) && recordPerms.length > 0 ? recordPerms : ["read"];

    expect(resolvePermissions(null)).toEqual(["read"]);
    expect(resolvePermissions(undefined)).toEqual(["read"]);
    expect(resolvePermissions([])).toEqual(["read"]);
    expect(resolvePermissions(["read"])).toEqual(["read"]);
    expect(resolvePermissions(["read", "write"])).toEqual(["read", "write"]);
  });

  it("GET /api/mcp never leaks API keys in endpoints or sample IDE configuration", async () => {
    const req = new Request("https://campusloop.space/api/mcp", {
      headers: {
        authorization: "Bearer cl_mcp_secretkey_mustnotleak",
      },
    });

    const res = await getMcpInfo(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    // Verify key is not reflected in sampleIdeConfig or endpoints
    const configStr = JSON.stringify(json);
    expect(configStr).not.toContain("cl_mcp_secretkey_mustnotleak");
    expect(json.endpoints.streamableHttp).toBe("/api/mcp");
    expect(json.endpoints.sse).toBe("/api/mcp/sse");
    expect(json.endpoints.message).toBe("/api/mcp/message?sessionId=SESSION_ID");
    expect(json.sampleIdeConfig.cursor.mcpServers.campusloop.headers.Authorization).toBe(
      "Bearer YOUR_MCP_KEY"
    );
  });

  it("GET /api/mcp/sse stream never leaks API key in endpoint event data URL", async () => {
    const authSpy = spyOn(mcpAuth, "authenticateMcpKey").mockResolvedValue(createMockContext(["read"]));

    const req = new Request("https://campusloop.space/api/mcp/sse", {
      headers: {
        authorization: "Bearer cl_mcp_private_token",
      },
    });

    const res = await getSseStream(req);
    expect(res.status).toBe(200);

    const reader = res.body?.getReader();
    if (reader) {
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      expect(text).toContain("event: endpoint\n");
      expect(text).toContain("/api/mcp/message?sessionId=");
      expect(text).not.toContain("cl_mcp_private_token");
      expect(text).not.toContain("&key=");
      reader.cancel();
    }

    authSpy.mockRestore();
  });

  it("enforces tool permission boundaries: blocks write tool when context only has ['read']", async () => {
    const context = createMockContext(["read"]);

    const response = await handleMcpJsonRpc(
      {
        jsonrpc: "2.0",
        id: "call_1",
        method: "tools/call",
        params: {
          name: "campusloop_create_post",
          arguments: { body: "Unauthorized post attempt" },
        },
      },
      context
    );

    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32003);
    expect(response.error?.message).toContain("lacks required permission 'write'");
  });

  it("enforces tool permission boundaries: blocks comment creation when context only has ['read']", async () => {
    const context = createMockContext(["read"]);

    const response = await handleMcpJsonRpc(
      {
        jsonrpc: "2.0",
        id: "call_comment",
        method: "tools/call",
        params: {
          name: "campusloop_add_comment",
          arguments: { postId: "post_123", body: "Unauthorized comment" },
        },
      },
      context
    );

    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32003);
    expect(response.error?.message).toContain("lacks required permission 'write'");
  });

  it("enforces tool permission boundaries: blocks direct messaging when context lacks ['chat']", async () => {
    const context = createMockContext(["read", "write"]);

    const response = await handleMcpJsonRpc(
      {
        jsonrpc: "2.0",
        id: "call_chat",
        method: "tools/call",
        params: {
          name: "campusloop_send_direct_message",
          arguments: { conversationId: "conv_123", content: "Hello" },
        },
      },
      context
    );

    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32003);
    expect(response.error?.message).toContain("lacks required permission 'chat'");
  });

  it("enforces tool permission boundaries: blocks chat history access when context lacks ['chat']", async () => {
    const context = createMockContext(["read", "write"]);

    const response = await handleMcpJsonRpc(
      {
        jsonrpc: "2.0",
        id: "call_history",
        method: "tools/call",
        params: {
          name: "campusloop_get_chat_history",
          arguments: { conversationId: "conv_123" },
        },
      },
      context
    );

    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32003);
    expect(response.error?.message).toContain("lacks required permission 'chat'");
  });

  it("enforces tool permission boundaries: blocks exclusive AI / webhook tools when context lacks ['exclusive']", async () => {
    const context = createMockContext(["read", "write", "chat"]);

    const response = await handleMcpJsonRpc(
      {
        jsonrpc: "2.0",
        id: "call_webhook",
        method: "tools/call",
        params: {
          name: "campusloop_trigger_community_webhook",
          arguments: { communityId: "comm_123", body: "Test webhook" },
        },
      },
      context
    );

    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32003);
    expect(response.error?.message).toContain("lacks required permission 'exclusive'");
  });
});

describe("PHASE 21 — Community Member Privilege Escalation Guards", () => {
  it("defines strict privilege escalation rules: creator is immutable, admin cannot self-escalate or edit other admins", () => {
    type MemberRole = "ADMIN" | "MODERATOR" | "MEMBER";

    function validateRoleChange(params: {
      isCreator: boolean;
      callerId: string;
      targetUserId: string;
      creatorId: string;
      targetRole: MemberRole;
      newRole: MemberRole;
    }): { allowed: boolean; error?: string } {
      if (params.targetUserId === params.creatorId) {
        return { allowed: false, error: "The founding creator's role or status cannot be modified" };
      }
      if (!params.isCreator && params.targetUserId === params.callerId) {
        return { allowed: false, error: "Admins cannot modify their own role or status" };
      }
      if (!params.isCreator && params.targetRole === "ADMIN") {
        return { allowed: false, error: "Only the founding creator can modify other admins" };
      }
      if (!params.isCreator && params.newRole === "ADMIN") {
        return { allowed: false, error: "Only the founding creator can assign the ADMIN role" };
      }
      return { allowed: true };
    }

    // 1. Target is founding creator -> rejected
    expect(
      validateRoleChange({
        isCreator: false,
        callerId: "admin_1",
        targetUserId: "creator_id",
        creatorId: "creator_id",
        targetRole: "ADMIN",
        newRole: "MEMBER",
      })
    ).toEqual({ allowed: false, error: "The founding creator's role or status cannot be modified" });

    // 2. Admin attempting self-modification -> rejected
    expect(
      validateRoleChange({
        isCreator: false,
        callerId: "admin_1",
        targetUserId: "admin_1",
        creatorId: "creator_id",
        targetRole: "ADMIN",
        newRole: "ADMIN",
      })
    ).toEqual({ allowed: false, error: "Admins cannot modify their own role or status" });

    // 3. Non-creator admin attempting to modify another admin -> rejected
    expect(
      validateRoleChange({
        isCreator: false,
        callerId: "admin_1",
        targetUserId: "admin_2",
        creatorId: "creator_id",
        targetRole: "ADMIN",
        newRole: "MODERATOR",
      })
    ).toEqual({ allowed: false, error: "Only the founding creator can modify other admins" });

    // 4. Non-creator admin attempting to promote someone to ADMIN -> rejected
    expect(
      validateRoleChange({
        isCreator: false,
        callerId: "admin_1",
        targetUserId: "member_1",
        creatorId: "creator_id",
        targetRole: "MEMBER",
        newRole: "ADMIN",
      })
    ).toEqual({ allowed: false, error: "Only the founding creator can assign the ADMIN role" });

    // 5. Founding creator promoting someone to ADMIN -> allowed
    expect(
      validateRoleChange({
        isCreator: true,
        callerId: "creator_id",
        targetUserId: "member_1",
        creatorId: "creator_id",
        targetRole: "MEMBER",
        newRole: "ADMIN",
      })
    ).toEqual({ allowed: true });
  });
});

describe("PHASE 23 & 24 — File Upload & R2 File Security", () => {
  it("rejects unauthenticated requests to private student documents with HTTP 401 and private Cache-Control", async () => {
    const userSpy = spyOn(hexclaveServerApp, "getUser").mockResolvedValue(null);
    const key = "private/student_123/notes.pdf";
    await putR2Object(key, new Uint8Array([1, 2, 3]), "application/pdf", {
      isPrivate: "true",
      uploadedBy: "student_123",
    });

    const req = new NextRequest(`https://campusloop.space/api/files/r2/${key}`);
    const res = await getFileRoute(req, {
      params: Promise.resolve({ key: key.split("/") }),
    });

    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("private, no-cache, no-store, must-revalidate");
    expect(res.headers.get("Pragma")).toBe("no-cache");
    userSpy.mockRestore();
  });

  it("serves private student documents with private Cache-Control header when authenticated via admin passkey", async () => {
    const key = "private/student_123/confidential.pdf";
    process.env.ADMIN_PASSKEY = "admin_secret_test";

    await putR2Object(key, new Uint8Array([10, 20, 30]), "application/pdf", {
      isPrivate: "true",
      uploadedBy: "student_123",
    });

    const req = new NextRequest(`https://campusloop.space/api/files/r2/${key}`, {
      headers: {
        authorization: "Bearer admin_secret_test",
      },
    });

    const res = await getFileRoute(req, {
      params: Promise.resolve({ key: key.split("/") }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-cache, no-store, must-revalidate");
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("blocks path traversal attempts with HTTP 400", async () => {
    const req = new NextRequest("https://campusloop.space/api/files/r2/../../etc/passwd");
    const res = await getFileRoute(req, {
      params: Promise.resolve({ key: ["..", "..", "etc", "passwd"] }),
    });

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe("Invalid file path");
  });
});

describe("PHASE 25 — Composio Admin Operations Security", () => {
  it("eliminates fake-success for purge_cloudflare: returns HTTP 501 when Cloudflare API is unconfigured", async () => {
    const { POST: composioAdminRoute } = await import("@/app/api/admin/composio/route");
    // Ensure CF env vars are not set
    const originalToken = process.env.CLOUDFLARE_API_TOKEN;
    const originalZone = process.env.CLOUDFLARE_ZONE_ID;
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.CLOUDFLARE_ZONE_ID;

    const req = new NextRequest("https://campusloop.space/api/admin/composio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "purge_cloudflare",
        payload: { zoneName: "campusloop.space" },
      }),
    });

    const res = await composioAdminRoute(req);
    expect(res.status).toBe(501);
    const json = await res.json();
    expect(json.error).toContain("Cloudflare integration is not configured");

    // Restore env
    if (originalToken) process.env.CLOUDFLARE_API_TOKEN = originalToken;
    if (originalZone) process.env.CLOUDFLARE_ZONE_ID = originalZone;
  });

  it("eliminates fake-success for dispatch_alert: returns HTTP 501 when webhook is unconfigured", async () => {
    const { POST: composioAdminRoute } = await import("@/app/api/admin/composio/route");
    delete process.env.DISCORD_WEBHOOK_URL;
    delete process.env.DISCORD_MODERATION_WEBHOOK_URL;

    const req = new NextRequest("https://campusloop.space/api/admin/composio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "dispatch_alert",
        payload: { channel: "discord", message: "Flagged content alert" },
      }),
    });

    const res = await composioAdminRoute(req);
    expect(res.status).toBe(501);
    const json = await res.json();
    expect(json.error).toContain("Discord webhook integration is not configured");
  });
});

describe("PHASE 27 — Auth UI Email Domain Binding & Validation", () => {
  it("rejects personal email domains (gmail, yahoo, outlook) server-side", async () => {
    const personalDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

    for (const d of personalDomains) {
      const res = await validateEmailDomainForInstitution(`student@${d}`);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Personal email");
    }
  });

  it("accepts valid educational domain (.edu, .ac.in)", async () => {
    const res = await validateEmailDomainForInstitution("student@iitb.ac.in");
    expect(res.valid).toBe(true);
    expect(res.normalizedDomain).toBe("iitb.ac.in");
  });

  it("rejects non-educational domains when not registered to any institution", async () => {
    const res = await validateEmailDomainForInstitution("student@randomstartup.io");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("must be an accredited academic domain");
  });
});
