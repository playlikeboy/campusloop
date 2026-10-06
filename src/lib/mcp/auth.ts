import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { mcpAuditLogs, userMcpKeys, userProfiles } from "@/db/schema";
import type { McpContext } from "./types";

export function extractMcpKeyFromRequest(req: Request): string | null {
  // Query parameters (?key=, ?token=, ?apiKey=) are strictly disallowed to prevent URL leakage

  // 1. Check Authorization header: Bearer cl_mcp_...
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const match =
      authHeader.match(/^Bearer\s+(cl_mcp_[a-zA-Z0-9_-]+)$/i) || authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) return match[1].trim();
  }

  // 2. Check custom header: x-campusloop-mcp-key or x-mcp-key
  const customHeader = req.headers.get("x-campusloop-mcp-key") || req.headers.get("x-mcp-key");
  if (customHeader) return customHeader.trim();

  return null;
}

export async function authenticateMcpKey(keyString: string, clientInfo?: string | null): Promise<McpContext> {
  const cleanKey = keyString.trim();
  if (!cleanKey) {
    throw new Error("Missing MCP API key");
  }

  const db = getDb();

  const keyRecord = await db.query.userMcpKeys.findFirst({
    where: eq(userMcpKeys.key, cleanKey),
  });

  if (!keyRecord) {
    throw new Error("Invalid MCP API key");
  }

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
        : ["read"],
    clientInfo: clientInfo || null,
  };
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
