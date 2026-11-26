import { hidesNotificationActor } from "@/lib/notification-anonymity";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { devicePushTokens, userProfiles } from "@/db/schema";
import { buildTitle, buildUrl, defaultBody } from "@/lib/notification-copy";

/**
 * Expo push for the Android app. Runs alongside the web push tickle in
 * src/lib/push-dispatch.ts; callers wrap it in `runInBackground`.
 *
 * - Batches of at most 100 messages per request (Expo's limit).
 * - Tokens Expo reports as `DeviceNotRegistered` are deleted.
 * - Never throws. Until drizzle/manual/0012_device_push_tokens.sql is applied
 *   the table does not exist: the query error is caught and logged once.
 */

export const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
export const EXPO_BATCH_SIZE = 100;

export interface ExpoPushContent {
  type: string;
  actorId: string;
  referenceId?: string | null;
}

export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: { url: string; type: string; referenceId: string | null };
  sound: "default";
  priority: "default" | "high";
  channelId: "default";
}

type ExpoTicket = { status: "ok"; id?: string } | { status: "error"; message?: string; details?: { error?: string } };

/** Expo token format: ExponentPushToken[...] or ExpoPushToken[...]. */
export function isExpoPushToken(token: unknown): token is string {
  return typeof token === "string" && token.length <= 255 && /^Expo(nent)?PushToken\[[^\]\s]+\]$/.test(token);
}

let missingTableLogged = false;

function isMissingTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string; cause?: { code?: string } } | null;
  return e?.code === "42P01" || e?.cause?.code === "42P01" || /device_push_tokens.*does not exist/i.test(String(e?.message ?? ""));
}

function logTableError(where: string, error: unknown) {
  if (isMissingTable(error)) {
    if (!missingTableLogged) console.warn(`[expo-push] ${where}: device_push_tokens table missing (apply drizzle/manual/0012)`);
    missingTableLogged = true;
    return;
  }
  console.error(`[expo-push] ${where} failed:`, error);
}

/** Sends one batch; returns the tokens Expo says are no longer registered. */
export async function sendExpoBatch(messages: ExpoMessage[], fetchImpl: typeof fetch = fetch): Promise<string[]> {
  if (messages.length === 0) return [];
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  const res = await fetchImpl(EXPO_PUSH_URL, { method: "POST", headers, body: JSON.stringify(messages) });
  if (!res.ok) {
    console.warn(`[expo-push] Expo rejected batch (${res.status}): ${(await res.text().catch(() => "")).slice(0, 300)}`);
    return [];
  }
  const json = (await res.json().catch(() => null)) as { data?: ExpoTicket[] } | null;
  const tickets = Array.isArray(json?.data) ? json.data : [];
  const dead: string[] = [];
  tickets.forEach((t, i) => {
    if (t?.status === "error" && t.details?.error === "DeviceNotRegistered" && messages[i]) dead.push(messages[i].to);
  });
  return dead;
}

/** Splits into Expo-sized batches, sends them in order, and returns every dead token. */
export async function sendExpoMessages(messages: ExpoMessage[], fetchImpl: typeof fetch = fetch): Promise<string[]> {
  const dead: string[] = [];
  for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
    try {
      dead.push(...(await sendExpoBatch(messages.slice(i, i + EXPO_BATCH_SIZE), fetchImpl)));
    } catch (error) {
      console.warn("[expo-push] batch send failed:", error);
    }
  }
  return dead;
}

/**
 * Push one notification to every Android install of the given students.
 * Title/body come from notification-copy (no user-written text); the app
 * routes on `data.url`.
 */
export async function pushExpoToUsers(
  profileIds: string[],
  content: ExpoPushContent,
  urgency: "normal" | "high" = "normal"
): Promise<void> {
  const ids = Array.from(new Set(profileIds.filter(Boolean)));
  if (ids.length === 0) return;
  const db = getDb();

  let rows: { profileId: string; expoToken: string }[] = [];
  try {
    for (let i = 0; i < ids.length; i += 500) {
      rows.push(
        ...(await db
          .select({ profileId: devicePushTokens.profileId, expoToken: devicePushTokens.expoToken })
          .from(devicePushTokens)
          .where(inArray(devicePushTokens.profileId, ids.slice(i, i + 500))))
      );
    }
  } catch (error) {
    logTableError("token lookup", error);
    return;
  }
  rows = rows.filter((r) => isExpoPushToken(r.expoToken));
  if (rows.length === 0) return;

  try {
    // CRUSH_ALERT and anonymous comments, replies and mentions never name the sender.
    let actorName = "Someone";
    if (!hidesNotificationActor(content.type)) {
      const actor = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.id, content.actorId),
        columns: { displayName: true },
      });
      actorName = actor?.displayName || "A student";
    }
    const title = buildTitle(content.type, actorName);
    const body = defaultBody(content.type, actorName);
    const data = { url: buildUrl(content.type, content.referenceId ?? null), type: content.type, referenceId: content.referenceId ?? null };
    const messages: ExpoMessage[] = rows.map((r) => ({
      to: r.expoToken,
      title,
      body,
      data,
      sound: "default",
      priority: urgency === "high" ? "high" : "default",
      channelId: "default",
    }));

    const dead = await sendExpoMessages(messages);
    if (dead.length > 0) {
      await db.delete(devicePushTokens).where(inArray(devicePushTokens.expoToken, dead));
    }
  } catch (error) {
    logTableError("send", error);
  }
}

/** Registers (or moves) a token to `profileId`. Returns false when the table is missing. */
export async function upsertDeviceToken(profileId: string, expoToken: string, platform: "android" | "ios"): Promise<boolean> {
  try {
    await getDb()
      .insert(devicePushTokens)
      .values({ profileId, expoToken, platform })
      .onConflictDoUpdate({
        target: devicePushTokens.expoToken,
        set: { profileId, platform, lastSeenAt: new Date() },
      });
    return true;
  } catch (error) {
    logTableError("register", error);
    return false;
  }
}

/** Removes a token only if it belongs to `profileId`. Returns false when the table is missing. */
export async function deleteDeviceToken(profileId: string, expoToken: string): Promise<boolean> {
  try {
    await getDb()
      .delete(devicePushTokens)
      .where(and(eq(devicePushTokens.expoToken, expoToken), eq(devicePushTokens.profileId, profileId)));
    return true;
  } catch (error) {
    logTableError("unregister", error);
    return false;
  }
}

export interface ExpoEndpointReport {
  kind: "expo";
  platform: string;
  /** Last characters of the token only, enough to tell devices apart. */
  device: string;
  result: "sent" | "expired" | "failed";
  detail?: string;
}

/**
 * Send a test notification to every Android/iOS install of one student and
 * report each ticket. Unregistered tokens are deleted as usual.
 */
export async function pushExpoTestToProfile(
  profileId: string,
  fetchImpl: typeof fetch = fetch
): Promise<ExpoEndpointReport[]> {
  let rows: { expoToken: string; platform: string }[] = [];
  try {
    rows = (
      await getDb()
        .select({ expoToken: devicePushTokens.expoToken, platform: devicePushTokens.platform })
        .from(devicePushTokens)
        .where(eq(devicePushTokens.profileId, profileId))
    ).filter((r) => isExpoPushToken(r.expoToken));
  } catch (error) {
    logTableError("test token lookup", error);
    return [];
  }
  if (rows.length === 0) return [];

  const messages: ExpoMessage[] = rows.map((r) => ({
    to: r.expoToken,
    title: buildTitle("TEST", "CampusLoop"),
    body: defaultBody("TEST", "CampusLoop"),
    data: { url: "/settings", type: "TEST", referenceId: null },
    sound: "default",
    priority: "high",
    channelId: "default",
  }));

  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  const mask = (t: string) => `…${t.replace(/\]$/, "").slice(-6)}`;

  try {
    const res = await fetchImpl(EXPO_PUSH_URL, { method: "POST", headers, body: JSON.stringify(messages) });
    if (!res.ok) {
      const detail = `Expo HTTP ${res.status}`;
      return rows.map((r) => ({ kind: "expo", platform: r.platform, device: mask(r.expoToken), result: "failed", detail }));
    }
    const json = (await res.json().catch(() => null)) as { data?: ExpoTicket[] } | null;
    const tickets = Array.isArray(json?.data) ? json.data : [];
    const dead: string[] = [];
    const reports = rows.map((r, i): ExpoEndpointReport => {
      const t = tickets[i];
      const base = { kind: "expo" as const, platform: r.platform, device: mask(r.expoToken) };
      if (t?.status === "ok") return { ...base, result: "sent" };
      if (t?.status === "error" && t.details?.error === "DeviceNotRegistered") {
        dead.push(r.expoToken);
        return { ...base, result: "expired", detail: "DeviceNotRegistered" };
      }
      return { ...base, result: "failed", detail: t?.status === "error" ? t.message || t.details?.error : "No ticket" };
    });
    if (dead.length > 0) await getDb().delete(devicePushTokens).where(inArray(devicePushTokens.expoToken, dead));
    return reports;
  } catch (error) {
    return rows.map((r) => ({
      kind: "expo",
      platform: r.platform,
      device: mask(r.expoToken),
      result: "failed",
      detail: error instanceof Error ? error.message : "Network error",
    }));
  }
}
