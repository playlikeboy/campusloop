/**
 * Text and deep link for a notification, shared by the web service worker
 * (/api/notifications/latest) and Expo pushes to the Android app.
 * Bodies are generic on purpose: user-written content (message text, comment
 * text) never travels through a push service.
 */

export function buildTitle(type: string, actorName: string): string {
  switch (type) {
    case "MATCH":
      return "It's a match";
    case "CRUSH_ALERT":
      return "Someone has a crush on you";
    case "FRIEND":
      return `${actorName} followed you back`;
    case "FOLLOW":
      return `${actorName} started following you`;
    case "MILESTONE":
      return "New Loop Points milestone";
    case "MESSAGE":
      return actorName;
    case "NEW_POST":
      return `${actorName} posted`;
    case "EVENT_REGISTRATION":
      return "You're registered";
    case "REMINDER":
      return "CampusLoop";
    default:
      return `${actorName} on CampusLoop`;
  }
}

export function defaultBody(type: string, actorName: string): string {
  switch (type) {
    case "LIKE":
      return `${actorName} liked your post`;
    case "STORY_LIKE":
      return `${actorName} liked your campus vibe`;
    case "COMMENT":
      return `${actorName} replied to your post`;
    case "ARTICLE_COMMENT":
      return `${actorName} commented on your article`;
    case "REPLY":
    case "STORY_REPLY":
      return `${actorName} replied to you`;
    case "MENTION":
      return `${actorName} mentioned you`;
    case "REPOST":
      return `${actorName} reposted you`;
    case "MATCH":
      return "You both liked each other — say hi!";
    case "CRUSH_ALERT":
      return "A verified student added you to their crush vault";
    case "FRIEND":
      return "You're campus friends now";
    case "FOLLOW":
      return "Tap to view their profile";
    case "MESSAGE":
      return "Sent you a message";
    case "NEW_POST":
      return `${actorName} shared something new on your campus`;
    case "EVENT_REGISTRATION":
      return "Your spot is confirmed — see you there";
    case "EVENT_REMINDER":
      return "Doors open soon. Tap for the details.";
    case "EVENT_UPDATE":
      return "The organiser posted an update";
    case "COMMUNITY_JOIN_REQUEST":
      return "Tap to approve or decline";
    case "COMMUNITY_JOIN_APPROVED":
      return "Your request to join was approved";
    case "TEST":
      return "Notifications are working on this device.";
    default:
      return "Open CampusLoop to see what's new";
  }
}

export function buildUrl(type: string, referenceId: string | null): string {
  // Resolved before the null guard: CRUSH_ALERT deliberately stores no
  // reference id (naming the crush would defeat the point), but it still has a
  // fixed destination.
  if (type === "CRUSH_ALERT") return "/crush";
  // Reminders store their in-app path as the reference.
  if (type === "REMINDER") return referenceId?.startsWith("/") ? referenceId : "/feeds";
  if (!referenceId) return "/notifications";
  switch (type) {
    case "LIKE":
    case "COMMENT":
    case "REPLY":
    case "MENTION":
    case "REPOST":
    case "NEW_POST":
      return `/post/${referenceId}`;
    case "STORY_LIKE":
    case "STORY_REPLY":
      return `/story/${referenceId}`;
    case "ARTICLE_COMMENT":
      return `/articles/${referenceId}`;
    case "MESSAGE":
    case "MATCH":
      return `/chat/${referenceId}`;
    case "EVENT_REGISTRATION":
    case "EVENT_REMINDER":
    case "EVENT_UPDATE":
      return `/events/${referenceId}`;
    case "COMMUNITY_JOIN_REQUEST":
      return `/communities/${referenceId}/members`;
    case "COMMUNITY_JOIN_APPROVED":
      return `/communities/${referenceId}`;
    case "FOLLOW":
    case "FRIEND":
      return `/@${referenceId}`;
    default:
      return "/notifications";
  }
}

/** What the service worker renders. Field names match public/sw.js. */
export interface PushNotificationPayload {
  title: string;
  body: string;
  url: string;
  type: string;
  /** Collapses repeats of the same thing (one chat thread, one post) into one banner. */
  tag: string;
  icon: string | null;
  /** Unread total for the app-icon badge, when known. */
  unreadCount?: number;
  /** Notification row id, when the push is about one. */
  id?: string;
}

/**
 * The push payload for one notification row. CRUSH_ALERT never names or shows
 * the sender. The body is the row's own preview when it has one (the payload is
 * end-to-end encrypted to the browser), otherwise generic copy.
 */
export function buildPushPayload({
  type,
  actorName,
  actorAvatarUrl,
  referenceId,
  previewText,
  unreadCount,
  id,
}: {
  type: string;
  actorName: string | null | undefined;
  actorAvatarUrl?: string | null;
  referenceId?: string | null;
  previewText?: string | null;
  unreadCount?: number;
  id?: string;
}): PushNotificationPayload {
  const anonymous = type === "CRUSH_ALERT";
  const name = anonymous ? "Someone" : actorName || "A student";
  const ref = referenceId ?? null;
  return {
    title: buildTitle(type, name),
    body: (previewText || defaultBody(type, name)).slice(0, 240),
    url: buildUrl(type, ref),
    type,
    tag: `${type}:${ref ?? "none"}`.slice(0, 120),
    icon: anonymous ? null : actorAvatarUrl || null,
    ...(typeof unreadCount === "number" ? { unreadCount } : {}),
    ...(id ? { id } : {}),
  };
}
