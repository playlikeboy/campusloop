"use client";

import {
  Bell,
  BellOff,
  Eraser,
  GraduationCap,
  Link2,
  Phone,
  School,
  Search,
  ShieldAlert,
  Trash2,
  User,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoopPointsSticker, VerifiedSticker } from "@/components/ui/stickers";
import type { CachedMessage } from "@/lib/chat-cache";
import { isOnline, presenceLabel } from "@/lib/presence";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./chat-avatar";
import { type ChatParticipant, formatMemberCount } from "./chat-format";
import { ChatSharedContent } from "./chat-shared-content";

const QUICK =
  "flex min-h-16 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-md bg-surface-muted text-xs font-medium text-fg transition-ui outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring";
const ROW =
  "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-base font-medium text-fg transition-ui outline-none hover:bg-surface-muted focus-visible:bg-surface-muted disabled:opacity-60";

interface ChatUserInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  otherParticipant: ChatParticipant | null;
  conversationId: string | null;
  messages: CachedMessage[];
  currentUserId: string;
  /** Current mute state of this chat. */
  isMuted?: boolean;
  onSearchClick?: () => void;
  onClearChat?: () => void;
  onDeleteChat?: () => void;
  onStartCall?: (type: "audio" | "video") => void;
}

/** Side panel with who you're chatting with, shared photos and links, and chat settings. */
export function ChatUserInfoDrawer({
  isOpen,
  onClose,
  otherParticipant: p,
  conversationId,
  messages,
  currentUserId,
  isMuted: mutedProp = false,
  onSearchClick,
  onClearChat,
  onDeleteChat,
  onStartCall,
}: ChatUserInfoDrawerProps) {
  const [isMuted, setIsMuted] = useState(mutedProp);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"clear" | "delete" | null>(null);

  // Re-read the real mute state each time the panel opens.
  useEffect(() => {
    if (isOpen) {
      setIsMuted(mutedProp);
      setConfirm(null);
    }
  }, [isOpen, mutedProp]);

  if (!p) return null;
  const isGroup = Boolean(p.isGroup || p.isCommunity);
  const online = isOnline(p.lastSeenAt);

  async function patch(action: string) {
    const res = await fetch(`/api/chat/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error(action);
  }

  async function toggleMute() {
    if (!conversationId) return;
    try {
      await patch(isMuted ? "unmute" : "mute");
      setIsMuted(!isMuted);
      toast.success(isMuted ? "Notifications on" : "Muted");
    } catch {
      toast.error("Couldn't change notifications. Try again.");
    }
  }

  async function confirmAction() {
    if (!conversationId || !confirm) return;
    setBusy(true);
    try {
      if (confirm === "clear") {
        await patch("clear");
        toast.success("Messages cleared");
        onClearChat?.();
      } else {
        const res = await fetch(`/api/chat/${conversationId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("delete");
        toast.success(isGroup ? "You left the group" : "Chat deleted");
        onClose();
        onDeleteChat?.();
      }
      setConfirm(null);
    } catch {
      toast.error("That didn't work. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const quick = (label: string, icon: React.ReactNode, onClick: () => void) => (
    <button type="button" className={QUICK} onClick={onClick}>
      {icon}
      {label}
    </button>
  );

  return (
    <Sheet side="right" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full max-w-md sm:w-[26rem]">
        <SheetHeader className="sr-only">
          <SheetTitle>{isGroup ? "Group info" : "Chat info"}</SheetTitle>
          <SheetDescription>Profile, shared photos and links, and chat settings.</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-6 pt-12">
          <section className="flex flex-col items-center gap-2 text-center">
            <ChatAvatar
              name={p.displayName}
              src={p.avatarUrl}
              lastSeenAt={p.lastSeenAt}
              showPresence={!isGroup}
              className="size-24"
            />
            <h2 className="max-w-full font-display text-2xl font-bold break-words text-fg">{p.displayName}</h2>
            {!isGroup && p.isCollegeVerified && <VerifiedSticker size="sm" />}
            <p className="text-sm text-fg-muted">
              {isGroup
                ? formatMemberCount(p.membersCount || p.participants?.length || 2)
                : [`@${p.username}`, online ? "Online" : presenceLabel(p.lastSeenAt)]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
            {p.bio && !isGroup && <p className="max-w-xs text-base text-fg">{p.bio}</p>}
            {!isGroup && (p.branch || p.year || p.institutionId) && (
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-fg-muted">
                {p.institutionId && (
                  <Link
                    href={`/college/${p.institutionId}`}
                    className="inline-flex items-center gap-1 font-medium text-brand-text hover:underline"
                  >
                    <School className="size-4" aria-hidden="true" /> College page
                  </Link>
                )}
                {p.branch && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="size-4" aria-hidden="true" />
                    {p.course ? `${p.course} · ` : ""}
                    {p.branch}
                  </span>
                )}
                {p.year && <span>Year {p.year}</span>}
              </div>
            )}
            {!isGroup && (p.points || 0) > 0 && (
              <LoopPointsSticker points={p.points || 0} size="sm" className="shadow-none" />
            )}
          </section>

          <section className="flex gap-2">
            {!isGroup ? (
              <>
                {quick("Call", <Phone className="size-5" />, () => {
                  onClose();
                  onStartCall?.("audio");
                })}
                {quick("Video", <Video className="size-5" />, () => {
                  onClose();
                  onStartCall?.("video");
                })}
                <Link href={`/@${p.username}`} onClick={onClose} className={QUICK}>
                  <User className="size-5" />
                  Profile
                </Link>
              </>
            ) : (
              quick("Copy link", <Link2 className="size-5" />, () => {
                void navigator.clipboard?.writeText(`${window.location.origin}/chat/${conversationId}`).then(
                  () => toast.success("Link copied. Only members can open it."),
                  () => toast.error("Couldn't copy the link. Try again.")
                );
              })
            )}
            {quick("Search", <Search className="size-5" />, () => {
              onClose();
              onSearchClick?.();
            })}
          </section>

          {isGroup && p.participants && p.participants.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-fg">Members ({p.participants.length})</h3>
              <ul className="space-y-0.5">
                {p.participants.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/@${m.username}`}
                      onClick={onClose}
                      className="flex min-h-12 items-center gap-3 rounded-md px-2 transition-ui hover:bg-surface-muted"
                    >
                      <ChatAvatar name={m.displayName} src={m.avatarUrl} className="size-9" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-fg">
                          {m.displayName}
                          {m.id === currentUserId ? " (you)" : ""}
                        </span>
                        <span className="block truncate text-xs text-fg-muted">@{m.username}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ChatSharedContent messages={messages} />

          <section className="space-y-0.5 border-t border-border pt-4">
            {confirm ? (
              <div className="space-y-3 rounded-md bg-surface-muted p-4">
                <p className="text-base font-medium text-fg">
                  {confirm === "clear"
                    ? "Clear all messages? This only clears them for you."
                    : isGroup
                      ? "Leave this group? You'll stop getting its messages."
                      : "Delete this chat? It goes from your inbox. They keep their copy."}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setConfirm(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    loading={busy}
                    onClick={() => void confirmAction()}
                  >
                    {confirm === "clear" ? "Clear" : isGroup ? "Leave" : "Delete"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <button type="button" className={ROW} onClick={() => void toggleMute()}>
                  {isMuted ? (
                    <Bell className="size-5 text-fg-muted" />
                  ) : (
                    <BellOff className="size-5 text-fg-muted" />
                  )}
                  {isMuted ? "Unmute notifications" : "Mute notifications"}
                </button>
                <button type="button" className={ROW} onClick={() => setConfirm("clear")}>
                  <Eraser className="size-5 text-fg-muted" /> Clear messages
                </button>
                <button
                  type="button"
                  className={cn(ROW, "text-danger hover:bg-danger-subtle")}
                  onClick={() => setConfirm("delete")}
                >
                  <Trash2 className="size-5" /> {isGroup ? "Leave group" : "Delete chat"}
                </button>
                <Link href="/safety" className={ROW} onClick={onClose}>
                  <ShieldAlert className="size-5 text-fg-muted" /> Report a problem
                </Link>
              </>
            )}
          </section>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
