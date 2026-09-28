"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { userMcpKeys, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { authenticateMcpKey } from "@/lib/mcp/auth";
import { handleMcpJsonRpc } from "@/lib/mcp/server";

export async function getUserMcpKeys() {
  const user = await hexclaveServerApp.getUser();
  if (!user) throw new Error("Not authenticated");

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!profile) throw new Error("Student profile not found");

  const keys = await db.query.userMcpKeys.findMany({
    where: eq(userMcpKeys.userId, profile.id),
    orderBy: [desc(userMcpKeys.createdAt)],
  });

  return keys;
}

export async function createMcpKey(name?: string) {
  const user = await hexclaveServerApp.getUser();
  if (!user) throw new Error("Not authenticated");

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!profile) throw new Error("Student profile not found");

  // Limit keys per student to 5
  const existingCount = await db.query.userMcpKeys.findMany({
    where: eq(userMcpKeys.userId, profile.id),
    columns: { id: true },
  });
  if (existingCount.length >= 5) {
    throw new Error("Maximum of 5 MCP API keys allowed per account. Please delete or rotate an unused key.");
  }

  const generatedKey = `cl_mcp_${randomUUID().replace(/-/g, "")}`;
  const keyName = name?.trim() || `IDE Key #${existingCount.length + 1}`;

  const [newKey] = await db
    .insert(userMcpKeys)
    .values({
      userId: profile.id,
      name: keyName,
      key: generatedKey,
      isActive: true,
      permissions: ["read", "write", "chat", "exclusive"],
      requestsCount: 0,
    })
    .returning();

  revalidatePath("/app/developer");
  revalidatePath("/app/settings");
  return newKey;
}

export async function toggleMcpKey(keyId: string, isActive: boolean) {
  const user = await hexclaveServerApp.getUser();
  if (!user) throw new Error("Not authenticated");

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!profile) throw new Error("Student profile not found");

  const [updated] = await db
    .update(userMcpKeys)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(userMcpKeys.id, keyId), eq(userMcpKeys.userId, profile.id)))
    .returning();

  revalidatePath("/app/developer");
  return updated;
}

export async function regenerateMcpKey(keyId: string) {
  const user = await hexclaveServerApp.getUser();
  if (!user) throw new Error("Not authenticated");

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!profile) throw new Error("Student profile not found");

  const newSecret = `cl_mcp_${randomUUID().replace(/-/g, "")}`;

  const [updated] = await db
    .update(userMcpKeys)
    .set({
      key: newSecret,
      updatedAt: new Date(),
    })
    .where(and(eq(userMcpKeys.id, keyId), eq(userMcpKeys.userId, profile.id)))
    .returning();

  revalidatePath("/app/developer");
  return updated;
}

export async function deleteMcpKey(keyId: string) {
  const user = await hexclaveServerApp.getUser();
  if (!user) throw new Error("Not authenticated");

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!profile) throw new Error("Student profile not found");

  await db
    .delete(userMcpKeys)
    .where(and(eq(userMcpKeys.id, keyId), eq(userMcpKeys.userId, profile.id)));

  revalidatePath("/app/developer");
  return { success: true };
}

export async function testExecuteMcpTool(
  keyString: string,
  toolName: string,
  args: Record<string, unknown>
) {
  const startTime = Date.now();
  try {
    const context = await authenticateMcpKey(keyString, "CampusLoop Playground");
    const response = await handleMcpJsonRpc(
      {
        jsonrpc: "2.0",
        id: "playground-test",
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args,
        },
      },
      context
    );

    const latencyMs = Date.now() - startTime;
    return {
      success: !response.error,
      latencyMs,
      response,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      error: err?.message || "Execution error",
    };
  }
}
