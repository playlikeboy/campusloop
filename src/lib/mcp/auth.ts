import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { mcpAuditLogs, userMcpKeys, userProfiles } from "@/db/schema";
import type { McpContext } from "./types";

export function extractMcpKeyFromRequest(req: Request): string | null {
  // 1. Check Authorization header: Bearer cl_mcp_... or custom token
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader) {
    const match =
      authHeader.match(/^Bearer\s+(cl_mcp_[a-zA-Z0-9_-]+)$/i) || authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) return match[1].trim();
  }

  // 2. Check custom headers
  const customHeader =
    req.headers.get("x-campusloop-mcp-key") ||
    req.headers.get("x-mcp-key") ||
    req.headers.get("x-api-key") ||
    req.headers.get("X-API-KEY");
  if (customHeader) return customHeader.trim();

  return null;
}

export async function authenticateMcpKey(keyString: string, clientInfo?: string | null): Promise<McpContext> {
  const cleanKey = keyString.trim();
  if (!cleanKey) {
    throw new Error("Missing MCP API key");
  }

  const db = getDb();

  // 1. Check master system keys configured in environment
  const masterKey =
    process.env.CAMPUSLOOP_MCP_API_KEY ||
    process.env.MCP_API_KEY ||
    process.env.MCP_EVENTS_API_KEY;

  if (masterKey && cleanKey === masterKey.trim()) {
    const primaryUser =
      (await db.query.userProfiles.findFirst({
        where: eq(userProfiles.role, "ADMIN"),
        with: { institution: true },
      })) ||
      (await db.query.userProfiles.findFirst({
        with: { institution: true },
      }));

    if (primaryUser) {
      return {
        userId: primaryUser.id,
        keyId: "master_system_key",
        user: primaryUser,
        institutionId: primaryUser.institutionId,
        institutionName: primaryUser.institution?.name || "Campus Community",
        permissions: ["read", "write", "chat", "exclusive"],
        clientInfo: clientInfo || null,
      };
    }
  }

  // 2. Look up user-issued API key in database
  const keyRecord = await db.query.userMcpKeys.findFirst({
    where: eq(userMcpKeys.key, cleanKey),
  });

  if (keyRecord) {
    if (!keyRecord.isActive) {
      throw new Error("MCP API key is paused or deactivated");
    }

    const user = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, keyRecord.userId),
      with: {
        institution: true,
      },
    });

    if (!user) {
      throw new Error("Associated student profile not found");
    }

    // Asynchronously record request count and last used timestamp
    db.update(userMcpKeys)
      .set({
        requestsCount: sql`${userMcpKeys.requestsCount} + 1`,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userMcpKeys.id, keyRecord.id))
      .catch((err) => console.error("Failed to update MCP key telemetry:", err));

    return {
      userId: user.id,
      keyId: keyRecord.id,
      user,
      institutionId: user.institutionId,
      institutionName: user.institution?.name || "Campus Community",
      permissions:
        Array.isArray(keyRecord.permissions) && (keyRecord.permissions as string[]).length > 0
          ? (keyRecord.permissions as string[])
          : ["read", "write", "chat", "exclusive"],
      clientInfo: clientInfo || null,
    };
  }

  throw new Error("Invalid MCP API key");
}

export async function logMcpAudit(
  context: McpContext,
  toolName: string,
  status: "SUCCESS" | "ERROR" | "BLOCKED",
  latencyMs?: number,
  errorSummary?: string
) {
  try {
    const db = getDb();
    await db.insert(mcpAuditLogs).values({
      keyId: context.keyId,
      userId: context.userId,
      toolName,
      status,
      latencyMs: latencyMs ?? null,
      clientInfo: context.clientInfo ?? null,
      errorSummary: errorSummary ? errorSummary.slice(0, 500) : null,
    });
  } catch (err) {
    console.error("Failed to record MCP audit log:", err);
  }
}
