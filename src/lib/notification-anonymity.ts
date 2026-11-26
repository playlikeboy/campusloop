/**
 * Notifications whose actor must never reach the recipient.
 *
 * The notifications table requires a real `actor_id` (it is a foreign key and
 * drives block filtering server-side), so anonymity is carried by the type:
 * an anonymous comment is stored as ANON_COMMENT, not COMMENT. Every place that
 * shows a notification to a person (the list API, the notifications page, web
 * push, Expo push) masks the actor for these types. Pure module: no DB, safe to
 * import from client code.
 */

const ANON_TO_BASE = {
  ANON_COMMENT: "COMMENT",
  ANON_REPLY: "REPLY",
  ANON_MENTION: "MENTION",
} as const;

export type AnonymousNotificationType = keyof typeof ANON_TO_BASE;

const BASE_TO_ANON: Record<string, AnonymousNotificationType> = {
  COMMENT: "ANON_COMMENT",
  REPLY: "ANON_REPLY",
  MENTION: "ANON_MENTION",
};

/** The display type (COMMENT for ANON_COMMENT) used for copy, icons, links and preferences. */
export function baseNotificationType(type: string): string {
  return (ANON_TO_BASE as Record<string, string>)[type] ?? type;
}

/** Type to store for an action done anonymously. Types without an anonymous twin are returned unchanged. */
export function anonymousNotificationType(type: string): string {
  return BASE_TO_ANON[type] ?? type;
}

/** True when the recipient must not learn who caused this notification. */
export function hidesNotificationActor(type: string): boolean {
  return type === "CRUSH_ALERT" || type in ANON_TO_BASE;
}

export const HIDDEN_ACTOR = {
  id: "hidden",
  username: "anonymous",
  displayName: "Someone",
  avatarUrl: null,
  points: 0,
  institutionId: null,
  role: "STUDENT",
  institution: null,
} as const;

/**
 * Strips the actor from a notification row for types that hide it: both the
 * joined `actor` object and the raw `actorId` column, which is the actor's
 * profile id and would otherwise ship to the client in a `...row` spread.
 */
export function maskNotificationActor<T extends { type: string; actorId?: string | null; actor?: unknown }>(
  row: T,
  actor: Record<string, unknown> = HIDDEN_ACTOR
): T {
  if (!hidesNotificationActor(row.type)) return row;
  return { ...row, actorId: null, actor };
}
