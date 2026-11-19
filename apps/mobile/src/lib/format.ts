export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "";
  const min = Math.round(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function eventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function authorName(p: { isAnonymous?: boolean; pseudonym?: string | null; author?: { displayName?: string | null; username?: string | null } | null }): string {
  if (p.isAnonymous) return p.pseudonym || "Anonymous";
  return p.author?.displayName || p.author?.username || "Student";
}

export function chatTitle(c: { title?: string | null; otherParticipant?: { displayName?: string | null; username?: string | null } | null }): string {
  return c.title || c.otherParticipant?.displayName || c.otherParticipant?.username || "Chat";
}
