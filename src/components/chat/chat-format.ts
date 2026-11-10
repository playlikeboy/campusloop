import type { CachedConversation, CachedMessage } from "@/lib/chat-cache";

/** Short inbox timestamp: "now", "5m", "4:30 pm", "Yesterday", "3d", "12 Aug". */
export function formatInboxTime(dateVal: string | Date): string {
  try {
    const d = new Date(dateVal);
    const now = new Date();
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    const days = Math.floor(hours / 24);
    if (days <= 1) return "Yesterday";
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/** Bubble timestamp, e.g. "4:30 pm". */
export function formatMessageTime(dateVal: string | Date): string {
  try {
    return new Date(dateVal).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Day divider label: "Today", "Yesterday" or "Mon, 12 Aug". */
export function formatDayLabel(dateVal: string | Date): string {
  try {
    const d = new Date(dateVal);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function formatMemberCount(count: number): string {
  return count === 1 ? "1 member" : `${count} members`;
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function initialOf(name?: string | null, fallback = "S"): string {
  return (name?.trim()?.[0] || fallback).toUpperCase();
}

export function isGroupConversation(conv: CachedConversation): boolean {
  return Boolean(conv.isGroup || conv.type === "GROUP" || conv.isCommunity);
}

// The API stores deleted messages with a leading no-entry sign. It is data, not decoration.
const DELETED_PREFIX = "\u{1F6AB} ";
export const DELETED_FOR_EVERYONE_BODY = `${DELETED_PREFIX}This message was deleted`;
export const DELETED_FOR_ME_BODY = `${DELETED_PREFIX}You deleted this message`;

export function isDeletedBody(body: string): boolean {
  return body.startsWith(DELETED_PREFIX);
}

export function deletedLabel(body: string): string {
  return body.slice(DELETED_PREFIX.length).trim() || "This message was deleted";
}

export type MessageKind = "deleted" | "crush-match" | "video" | "voice" | "document" | "image" | "text";

// Legacy voice notes were sent as "<microphone> [Voice Memo ...".
const LEGACY_VOICE_MARKER = "\u{1F399}\u{FE0F} [Voice Memo";

export function messageKind(body: string): MessageKind {
  const raw = body.trim();
  if (isDeletedBody(raw)) return "deleted";
  if (raw.includes("Secret Crush Match") || raw.includes("We both secretly liked each other")) {
    return "crush-match";
  }
  if (
    raw.startsWith("![video") ||
    /\.(mp4|webm|mov)(\?.*)?$/i.test(raw) ||
    raw.includes("/api/files/r2/videos/")
  ) {
    return "video";
  }
  if (
    raw.startsWith("![voice") ||
    raw.startsWith("![audio") ||
    raw.includes(LEGACY_VOICE_MARKER) ||
    /\.(mp3|wav|m4a|ogg)(\?.*)?$/i.test(raw) ||
    raw.includes("/api/files/r2/audio/")
  ) {
    return "voice";
  }
  if (
    raw.startsWith("![document") ||
    raw.startsWith("![pdf") ||
    /\.(pdf|docx|doc|zip|rar|xlsx)(\?.*)?$/i.test(raw) ||
    raw.includes("/api/files/r2/documents/")
  ) {
    return "document";
  }
  if (
    /^https?:\/\/.+\.(gif|jpeg|jpg|png|webp)(\?.*)?$/i.test(raw) ||
    raw.startsWith("https://media.giphy.com/") ||
    raw.startsWith("https://i.giphy.com/") ||
    raw.startsWith("![image")
  ) {
    return "image";
  }
  return "text";
}

/** URL inside a "![kind:name](url)" body, or the body itself when it is a bare URL. */
export function mediaUrl(body: string): string {
  return body.match(/\((https?:\/\/[^\s)]+)\)/)?.[1] || body.trim();
}

export function documentMeta(body: string): { name: string; size?: number } {
  const name = body.match(/!\[(?:document|pdf):([^:\]]+)/)?.[1] || "Document";
  const size = body.match(/!\[(?:document|pdf):[^:]+:(\d+)\]/)?.[1];
  return { name, size: size ? Number.parseInt(size, 10) : undefined };
}

/** Replies are stored as "> quoted line...\n\nreply text". */
export function splitQuote(body: string): { quote: string | null; text: string } {
  if (!body.startsWith("> ")) return { quote: null, text: body };
  const parts = body.split("\n\n");
  return { quote: parts[0].replace(/^> /, ""), text: parts.slice(1).join("\n\n") || parts[0] };
}

export function buildReplyBody(replyTo: CachedMessage | null, text: string): string {
  if (!replyTo) return text;
  return `> ${replyTo.body.split("\n")[0].slice(0, 60)}...\n\n${text}`;
}

/** Plain text for the inbox preview line. */
export function previewText(body: string | undefined | null): string {
  if (!body) return "No messages yet";
  switch (messageKind(body)) {
    case "deleted":
      return deletedLabel(body);
    case "video":
      return "Video";
    case "voice":
      return "Voice note";
    case "document":
      return documentMeta(body).name;
    case "image":
      return "Photo";
    case "crush-match":
      return "It's a match";
    default:
      return splitQuote(body).text;
  }
}

export type ChatParticipant = CachedConversation["otherParticipant"];
