import { inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications, userProfiles } from "@/db/schema";
import { runInBackground } from "@/lib/background";
import {
  channelForType,
  filterAllowedRecipients,
  isNotificationAllowed,
} from "@/lib/notification-preferences";
import { anonymousNotificationType } from "@/lib/notification-anonymity";
import { dispatchNotificationEmail } from "@/lib/notifications-email";
import { pushExpoToUsers } from "@/lib/expo-push";
import { pushToUser } from "@/lib/push-dispatch";

export type NotificationType =
  | "LIKE"
  | "COMMENT"
  | "ARTICLE_COMMENT"
  | "REPLY"
  | "MENTION"
  | "REPOST"
  | "MATCH"
  | "CRUSH_ALERT"
  | "MILESTONE"
  | "FOLLOW"
  | "FRIEND"
  | "STORY_LIKE"
  | "STORY_REPLY"
  | "MESSAGE"
  | "NEW_POST"
  | "EVENT_REGISTRATION"
  | "EVENT_REMINDER"
  | "EVENT_UPDATE"
  | "COMMUNITY_JOIN_REQUEST"
  | "COMMUNITY_JOIN_APPROVED"
  | "GAMING_LOBBY_JOIN"
  | "GAMING_LOBBY_FULL"
  | "GAMING_MATCH_READY"
  | "TOURNAMENT_UPDATE"
  /** Streak and campus reminders from the engagement cron (src/lib/engagement/run.ts). */
  | "REMINDER"
  /** Stored twins of COMMENT, REPLY and MENTION for anonymous actions; see src/lib/notification-anonymity.ts. */
  | "ANON_COMMENT"
  | "ANON_REPLY"
  | "ANON_MENTION";

export interface CreateNotificationParams {
  userId: string;
  actorId: string;
  type: NotificationType;
  referenceId?: string | null;
  previewText?: string | null;
  /**
   * Write the row but do not wake the recipient's devices.
   *
   * For notifications the recipient themselves just caused — the match they
   * swiped into, the event they registered for — the entry belongs in their
   * list, but buzzing the phone they are holding is pure noise.
   */
  silent?: boolean;
  /**
   * The action was done anonymously (anonymous comment, reply or post). The row
   * is stored under the ANON_* twin of `type`, so every reader hides the actor.
   */
  anonymous?: boolean;
}

/**
 * System notifications about the recipient's own progress (level-ups, streak
 * milestones). The student is both recipient and actor, so these are exempt
 * from the self-notification guard.
 */
const SELF_ADDRESSED_TYPES = new Set<NotificationType>(["MILESTONE", "EVENT_REMINDER"]);

/** Types that should buzz a phone immediately rather than ride the normal queue. */
const HIGH_URGENCY_TYPES = new Set<NotificationType>(["MATCH", "MESSAGE", "EVENT_REMINDER"]);

/**
 * Truncate and clean text snippet for notification previews
 */
export function cleanNotificationSnippet(text: string, maxLength = 120): string {
  if (!text) return "";
  // Strip markdown images and links
  const cleaned = text
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 3)}...`;
}

/**
 * Regex-based extraction of @username handles
 */
export function extractMentionUsernames(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/(?:^|\s)@([a-zA-Z0-9_]+)/g);
  if (!matches) return [];

  const handles = matches.map((m) => m.trim().replace(/^@/, "").toLowerCase()).filter(Boolean);

  return Array.from(new Set(handles));
}

/**
 * Create a single notification with self-notification safety guard.
 *
 * Honours the recipient's account-wide channel switches and any mute they have
 * placed on this specific actor, so a muted person's activity produces no row,
 * no push and no email — nothing for the student to dismiss later.
 */
export async function createNotification(input: CreateNotificationParams): Promise<boolean> {
  const params: CreateNotificationParams = input.anonymous
    ? { ...input, type: anonymousNotificationType(input.type) as NotificationType }
    : input;

  // Prevent notifying oneself about one's own social actions
  if (params.userId === params.actorId && !SELF_ADDRESSED_TYPES.has(params.type)) {
    return false;
  }

  const allowed = await isNotificationAllowed({
    userId: params.userId,
    actorId: params.actorId,
    channel: channelForType(params.type),
  });
  if (!allowed) return false;

  try {
    const db = getDb();
    await db.insert(notifications).values({
      userId: params.userId,
      actorId: params.actorId,
      type: params.type,
      referenceId: params.referenceId || null,
      previewText: params.previewText ? cleanNotificationSnippet(params.previewText) : null,
    });

    // Wake the recipient's devices; failures here never fail the write above.
    // Both side channels run under waitUntil — a bare un-awaited promise is
    // cancelled by the Workers runtime as soon as the response is returned.
    if (!params.silent) {
      const urgency = HIGH_URGENCY_TYPES.has(params.type) ? "high" : "normal";
      runInBackground(pushToUser(params.userId, urgency), "notification push");
      runInBackground(
        pushExpoToUsers(
          [params.userId],
          { type: params.type, actorId: params.actorId, referenceId: params.referenceId },
          urgency
        ),
        "notification expo push"
      );
    }

    // Dispatch transactional email via Cloudflare Email Sending
    runInBackground(dispatchNotificationEmail(params), "notification email");

    return true;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
}

/**
 * Fan one event out to many recipients — a new post reaching every follower.
 *
 * Deliberately not a loop over `createNotification`: the mute/preference check
 * is batched into two queries and the rows land in a single multi-value insert,
 * so the cost is bounded by the audience size rather than multiplied by it.
 * Pushes are still per-device and are fired concurrently in capped waves.
 *
 * Returns the number of students actually notified.
 */
export async function createNotificationsForMany({
  recipientIds,
  actorId,
  type,
  referenceId,
  previewText,
  maxRecipients = 500,
}: {
  recipientIds: string[];
  actorId: string;
  type: NotificationType;
  referenceId?: string | null;
  previewText?: string | null;
  maxRecipients?: number;
}): Promise<number> {
  const channel = channelForType(type);

  const unique = Array.from(new Set(recipientIds)).filter(
    (id) => id && (id !== actorId || SELF_ADDRESSED_TYPES.has(type))
  );
  if (unique.length === 0) return 0;

  try {
    // Types without a channel (event reminders, community approvals) have no
    // switch to turn off, so every recipient gets them — the same rule
    // `createNotification` applies. Returning early here used to drop them all.
    const allowed = channel ? await filterAllowedRecipients({ recipientIds: unique, actorId, channel }) : unique;
    // A viral account should not be able to turn one post into an unbounded
    // write amplification; the newest followers past the cap simply see the
    // post in their feed instead of on their lock screen.
    const audience = allowed.slice(0, maxRecipients);
    if (audience.length === 0) return 0;

    const db = getDb();
    const snippet = previewText ? cleanNotificationSnippet(previewText) : null;

    await db.insert(notifications).values(
      audience.map((userId) => ({
        userId,
        actorId,
        type,
        referenceId: referenceId || null,
        previewText: snippet,
      }))
    );

    // Wake devices in waves so a large audience never opens hundreds of
    // simultaneous sockets from one worker invocation.
    const urgency = HIGH_URGENCY_TYPES.has(type) ? "high" : "normal";
    const WAVE = 25;
    runInBackground(
      (async () => {
        for (let i = 0; i < audience.length; i += WAVE) {
          await Promise.all(audience.slice(i, i + WAVE).map((userId) => pushToUser(userId, urgency)));
        }
      })(),
      "notification fan-out push"
    );
    // Android app: one Expo request per 100 devices for the whole audience.
    runInBackground(pushExpoToUsers(audience, { type, actorId, referenceId }, urgency), "notification fan-out expo push");

    return audience.length;
  } catch (error) {
    console.error("Failed to fan out notifications:", error);
    return 0;
  }
}

/**
 * Dispatches MENTION notifications to all valid users tagged in a post or comment
 */
export async function notifyMentions({
  text,
  actorId,
  referenceId,
  anonymous = false,
}: {
  text: string;
  actorId: string;
  referenceId: string;
  /** The text was posted anonymously, so the mention must not name its author. */
  anonymous?: boolean;
}): Promise<void> {
  const handles = extractMentionUsernames(text);
  if (handles.length === 0) return;

  try {
    const db = getDb();
    const matchedUsers = await db.query.userProfiles.findMany({
      where: inArray(sql`LOWER(${userProfiles.username})`, handles),
      columns: {
        id: true,
        username: true,
      },
    });

    const snippet = cleanNotificationSnippet(text);

    for (const user of matchedUsers) {
      if (user.id !== actorId) {
        await createNotification({
          userId: user.id,
          actorId,
          type: "MENTION",
          referenceId,
          previewText: snippet,
          anonymous,
        });
      }
    }
  } catch (error) {
    console.error("Failed to notify mentioned users:", error);
  }
}
