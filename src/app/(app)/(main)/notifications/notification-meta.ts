import { baseNotificationType } from "@/lib/notification-anonymity";
import {
  AtSign,
  Bell,
  CalendarClock,
  Gamepad2,
  Heart,
  type LucideIcon,
  Megaphone,
  MessageCircle,
  Repeat2,
  Send,
  Sparkles,
  Ticket,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import type { NotificationItem } from "@/hooks/use-notifications";

/** Colour by meaning: crush = Campus Match, reward = Loop Points, brand = everything else. */
export type NotificationTone = "brand" | "crush" | "reward";

export interface NotificationMeta {
  Icon: LucideIcon;
  tone: NotificationTone;
  text: string;
  href: string;
}

const ref = (n: NotificationItem, prefix: string, fallback: string) =>
  n.referenceId ? `${prefix}${n.referenceId}` : fallback;

export function getNotificationMeta(n: NotificationItem): NotificationMeta {
  switch (baseNotificationType(n.type)) {
    case "LIKE":
      return { Icon: Heart, tone: "brand", text: "liked your post", href: ref(n, "/post/", "/feeds") };
    case "STORY_LIKE":
      return { Icon: Heart, tone: "brand", text: "liked your story", href: ref(n, "/story/", "/feeds") };
    case "COMMENT":
      return {
        Icon: MessageCircle,
        tone: "brand",
        text: "commented on your post",
        href: ref(n, "/post/", "/feeds"),
      };
    case "ARTICLE_COMMENT":
      return {
        Icon: MessageCircle,
        tone: "brand",
        text: "commented on your article",
        href: ref(n, "/articles/", "/articles"),
      };
    case "REPLY":
      return {
        Icon: MessageCircle,
        tone: "brand",
        text: "replied to your comment",
        href: ref(n, "/post/", "/feeds"),
      };
    case "STORY_REPLY":
      return {
        Icon: MessageCircle,
        tone: "brand",
        text: "replied to your story",
        href: ref(n, "/story/", "/feeds"),
      };
    case "MENTION":
      return { Icon: AtSign, tone: "brand", text: "mentioned you", href: ref(n, "/post/", "/feeds") };
    case "REPOST":
      return { Icon: Repeat2, tone: "brand", text: "reposted your post", href: ref(n, "/post/", "/feeds") };
    case "MATCH":
      return { Icon: Heart, tone: "crush", text: "matched with you", href: ref(n, "/chat/", "/chat") };
    case "CRUSH_ALERT":
      return { Icon: Heart, tone: "crush", text: "Someone added you as a secret crush", href: "/crush" };
    case "FOLLOW":
      return { Icon: UserPlus, tone: "brand", text: "followed you", href: ref(n, "/@", "/feeds") };
    case "FRIEND":
      return {
        Icon: Users,
        tone: "brand",
        text: "followed you back. You're friends now",
        href: ref(n, "/@", "/feeds"),
      };
    case "MILESTONE":
      return { Icon: Trophy, tone: "reward", text: "You reached a new milestone", href: "/streaks" };
    case "REMINDER":
      return {
        Icon: Bell,
        tone: "brand",
        text: n.previewText || "News from your campus",
        href: n.referenceId?.startsWith("/") ? n.referenceId : "/feeds",
      };
    case "MESSAGE":
      return { Icon: Send, tone: "brand", text: "sent you a message", href: ref(n, "/chat/", "/chat") };
    case "NEW_POST":
      return {
        Icon: Sparkles,
        tone: "brand",
        text: "posted something new",
        href: ref(n, "/post/", "/feeds"),
      };
    case "EVENT_REGISTRATION":
      return {
        Icon: Ticket,
        tone: "brand",
        text: "Your spot is confirmed",
        href: ref(n, "/events/", "/events"),
      };
    case "EVENT_REMINDER":
      return {
        Icon: CalendarClock,
        tone: "brand",
        text: "An event you registered for starts soon",
        href: ref(n, "/events/", "/events"),
      };
    case "EVENT_UPDATE":
      return {
        Icon: Megaphone,
        tone: "brand",
        text: "posted an update for an event you're attending",
        href: ref(n, "/events/", "/events"),
      };
    case "COMMUNITY_JOIN_REQUEST":
      return {
        Icon: UserPlus,
        tone: "brand",
        text: "asked to join your community",
        href: n.referenceId ? `/communities/${n.referenceId}/members` : "/communities",
      };
    case "COMMUNITY_JOIN_APPROVED":
      return {
        Icon: Users,
        tone: "brand",
        text: "Your request to join a community was approved",
        href: ref(n, "/communities/", "/communities"),
      };
    case "GAMING_LOBBY_JOIN":
      return {
        Icon: Gamepad2,
        tone: "brand",
        text: "joined your lobby",
        href: "/feeds",
      };
    case "GAMING_LOBBY_FULL":
      return {
        Icon: Gamepad2,
        tone: "brand",
        text: "Your lobby is full",
        href: "/feeds",
      };
    case "GAMING_MATCH_READY":
      return {
        Icon: Trophy,
        tone: "brand",
        text: "Your tournament match is ready",
        href: "/feeds",
      };
    case "TOURNAMENT_UPDATE":
      return {
        Icon: Trophy,
        tone: "brand",
        text: "A tournament you're in was updated",
        href: "/feeds",
      };
    default:
      return { Icon: Bell, tone: "brand", text: "sent you a notification", href: "/feeds" };
  }
}

/** Types whose text is a full sentence, so the actor's name is not put in front of it. */
export const SYSTEM_TYPES = new Set([
  "CRUSH_ALERT",
  "REMINDER",
  "MILESTONE",
  "EVENT_REGISTRATION",
  "EVENT_REMINDER",
  "COMMUNITY_JOIN_APPROVED",
  "GAMING_LOBBY_FULL",
  "GAMING_MATCH_READY",
  "TOURNAMENT_UPDATE",
]);

/**
 * Loop Points total from a points milestone, read from the text the server wrote
 * ("... with 320 LP."). Null for every other notification.
 */
export function pointsFromNotification(n: NotificationItem): number | null {
  if (n.type !== "MILESTONE" || !n.previewText) return null;
  const match = n.previewText.match(/\b(?:with|reached)\s+([\d,]+)\s+LP\b/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

/** Splits a newest-first list into Today, This week (the six days before) and Earlier, keeping order. */
export function groupByDay(list: NotificationItem[], now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
  const today: NotificationItem[] = [];
  const week: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];
  for (const n of list) {
    const t = new Date(n.createdAt).getTime();
    (t >= startOfToday ? today : t >= startOfWeek ? week : earlier).push(n);
  }
  return [
    { id: "today", label: "Today", items: today },
    { id: "week", label: "This week", items: week },
    { id: "earlier", label: "Earlier", items: earlier },
  ].filter((g) => g.items.length > 0);
}

/** Compact age for a narrow row: "now", "5m", "3h", "2d", "4w", then a date. */
export function shortTimeAgo(value: string | Date, now = new Date()): string {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((now.getTime() - t) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  if (s < 30 * 86400) return `${Math.floor(s / (7 * 86400))}w`;
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
