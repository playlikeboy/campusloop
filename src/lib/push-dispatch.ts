import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";
import { buildPushPayload, type PushNotificationPayload } from "@/lib/notification-copy";
import { sendWebPush, type WebPushDetailedResult } from "@/lib/web-push";

/**
 * A subscription that keeps being rejected for a reason that will not fix
 * itself (403: created under an old VAPID key, 400: malformed) is dropped after
 * this many consecutive failures. 404/410 drop it straight away.
 */
const MAX_CONSECUTIVE_FAILURES = 5;

/**
 * The newest unread notification for a student, rendered as a push payload,
 * plus their unread total for the app badge. Null when nothing is unread.
 */
export async function buildLatestPushPayload(userId: string): Promise<PushNotificationPayload | null> {
  const db = getDb();
  const [latest] = await db.query.notifications.findMany({
    where: and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    orderBy: [desc(notifications.createdAt)],
    limit: 1,
    with: { actor: { columns: { displayName: true, avatarUrl: true } } },
  });
  if (!latest) return null;

  const [unreadRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return buildPushPayload({
    type: latest.type,
    actorName: latest.actor?.displayName,
    actorAvatarUrl: latest.actor?.avatarUrl,
    referenceId: latest.referenceId,
    previewText: latest.previewText,
    unreadCount: unreadRow?.count ?? 0,
    id: latest.id,
  });
}

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string; failureCount: number };

/**
 * Send one payload to every subscription row and keep the table clean:
 * dead endpoints are deleted, persistent rejections counted and eventually
 * deleted, and a recovered endpoint has its failure count reset.
 */
async function deliver(
  subs: SubRow[],
  payload: PushNotificationPayload | null,
  urgency: "normal" | "high"
): Promise<{ sub: SubRow; outcome: WebPushDetailedResult }[]> {
  const db = getDb();
  const results = await Promise.all(
    subs.map(async (sub) => ({
      sub,
      outcome: await sendWebPush(sub, payload, {
        urgency,
        // A chat ping is stale after an hour; everything else may wait a day.
        ttl: payload?.type === "MESSAGE" ? 3600 : 86400,
        topic: payload ? payload.tag.replace(/[^A-Za-z0-9_-]/g, "").slice(-32) : undefined,
      }),
    }))
  );

  const toDelete: string[] = [];
  const toBump: string[] = [];
  const toReset: string[] = [];
  for (const { sub, outcome } of results) {
    if (outcome.result === "expired") toDelete.push(sub.id);
    else if (outcome.result === "failed" && (outcome.status === 400 || outcome.status === 403)) {
      if (sub.failureCount + 1 >= MAX_CONSECUTIVE_FAILURES) toDelete.push(sub.id);
      else toBump.push(sub.id);
    } else if (outcome.result === "sent" && sub.failureCount > 0) toReset.push(sub.id);
  }

  if (toDelete.length > 0) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, toDelete));
  if (toBump.length > 0) {
    await db
      .update(pushSubscriptions)
      .set({ failureCount: sql`${pushSubscriptions.failureCount} + 1` })
      .where(inArray(pushSubscriptions.id, toBump));
  }
  if (toReset.length > 0) {
    await db.update(pushSubscriptions).set({ failureCount: 0 }).where(inArray(pushSubscriptions.id, toReset));
  }
  return results;
}

async function loadSubscriptions(userId: string): Promise<SubRow[]> {
  return getDb()
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      failureCount: pushSubscriptions.failureCount,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

/**
 * Wake every browser a student has registered, with the notification encrypted
 * into the push itself. Without an explicit `payload` the newest unread
 * notification is sent, so callers that just inserted a row can call this with
 * only the user id. Dead endpoints are pruned as we discover them.
 *
 * Never throws: a failed push must not fail the action that triggered it.
 */
export async function pushToUser(
  userId: string,
  urgency: "normal" | "high" = "normal",
  payload?: PushNotificationPayload | null
): Promise<void> {
  try {
    const subs = await loadSubscriptions(userId);
    if (subs.length === 0) return;

    // Nothing unread any more (already read in another tab): stay quiet rather
    // than show a stale banner.
    const content = payload ?? (await buildLatestPushPayload(userId));
    if (!content) return;

    await deliver(subs, content, urgency);
  } catch (error) {
    console.error("pushToUser failed:", error);
  }
}

export interface PushEndpointReport {
  kind: "web";
  /** Push service host only, never the full capability URL. */
  service: string;
  result: WebPushDetailedResult["result"];
  status?: number;
  detail?: string;
}

/** Send a test notification to every browser of one student and report per endpoint. */
export async function pushTestToUser(userId: string): Promise<PushEndpointReport[]> {
  const subs = await loadSubscriptions(userId);
  if (subs.length === 0) return [];

  const payload: PushNotificationPayload = {
    ...buildPushPayload({ type: "TEST", actorName: null, referenceId: null }),
    url: "/settings",
    tag: `TEST:${Date.now()}`,
  };
  const results = await deliver(subs, payload, "high");
  return results.map(({ sub, outcome }) => {
    let service = "unknown";
    try {
      service = new URL(sub.endpoint).host;
    } catch {}
    return { kind: "web", service, result: outcome.result, status: outcome.status, detail: outcome.detail };
  });
}
