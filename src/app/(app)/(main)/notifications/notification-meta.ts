import {
  AtSign,
  Bell,
  Gamepad2,
  Heart,
  type LucideIcon,
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
  switch (n.type) {
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
    case "GAMING_LOBBY_JOIN":
      return {
        Icon: Gamepad2,
        tone: "brand",
        text: "joined your lobby",
        href: ref(n, "/gaming?id=", "/gaming"),
      };
    case "GAMING_LOBBY_FULL":
      return {
        Icon: Gamepad2,
        tone: "brand",
        text: "Your lobby is full",
        href: ref(n, "/gaming?id=", "/gaming"),
      };
    case "GAMING_MATCH_READY":
      return {
        Icon: Trophy,
        tone: "brand",
        text: "Your tournament match is ready",
        href: ref(n, "/gaming/tournaments/", "/gaming"),
      };
    case "TOURNAMENT_UPDATE":
      return {
        Icon: Trophy,
        tone: "brand",
        text: "A tournament you're in was updated",
        href: ref(n, "/gaming/tournaments/", "/gaming"),
      };
    default:
      return { Icon: Bell, tone: "brand", text: "sent you a notification", href: "/feeds" };
  }
}

/** Types whose text is a full sentence, so the actor's name is not put in front of it. */
export const SYSTEM_TYPES = new Set([
  "CRUSH_ALERT",
  "MILESTONE",
  "EVENT_REGISTRATION",
  "GAMING_LOBBY_FULL",
  "GAMING_MATCH_READY",
  "TOURNAMENT_UPDATE",
]);
