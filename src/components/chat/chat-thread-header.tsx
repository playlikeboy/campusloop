"use client";

import { ArrowLeft, Info, MoreVertical, Phone, Search, User, Video, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { VerifiedSticker } from "@/components/ui/stickers";
import { isOnline, presenceLabel } from "@/lib/presence";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./chat-avatar";
import { type ChatParticipant, formatMemberCount } from "./chat-format";

const ICON_BTN =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring";
const MENU_ITEM =
  "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-fg transition-ui outline-none hover:bg-surface-muted focus-visible:bg-surface-muted";

interface ChatThreadHeaderProps {
  participant: ChatParticipant;
  onBack?: () => void;
  onOpenInfo: () => void;
  onStartCall: (type: "audio" | "video") => void;
  searchOpen: boolean;
  onToggleSearch: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

/** Thread top bar: back, who you're talking to, call and search buttons, overflow menu, in-chat search. */
export function ChatThreadHeader({
  participant: p,
  onBack,
  onOpenInfo,
  onStartCall,
  searchOpen,
  onToggleSearch,
  searchQuery,
  onSearchChange,
}: ChatThreadHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isGroup = Boolean(p.isGroup || p.isCommunity);
  const online = isOnline(p.lastSeenAt);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  const subtitle = isGroup
    ? formatMemberCount(p.membersCount || p.participants?.length || 2)
    : online
      ? "Online"
      : presenceLabel(p.lastSeenAt) || `@${p.username}`;

  return (
    <header className="z-30 shrink-0 border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-4xl items-center gap-1 px-1.5 sm:px-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to chats"
            className={cn(ICON_BTN, "md:hidden")}
          >
            <ArrowLeft className="size-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenInfo}
          aria-label={
            isGroup ? `Group info for ${p.displayName}` : `Profile and shared media for ${p.displayName}`
          }
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-full py-1 pr-2 pl-1 text-left transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChatAvatar
            name={p.displayName}
            src={p.avatarUrl}
            lastSeenAt={p.lastSeenAt}
            showPresence={!isGroup}
            className="size-10"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-base font-semibold text-fg">{p.displayName}</span>
              {isGroup ? (
                <Badge variant="neutral">{p.isCommunity ? "Community" : "Group"}</Badge>
              ) : (
                p.isCollegeVerified && (
                  <VerifiedSticker size="sm" label="Verified" variant="flat" className="shrink-0" />
                )
              )}
            </span>
            <span
              className={cn(
                "block truncate text-xs",
                online && !isGroup ? "text-verified-text" : "text-fg-muted"
              )}
            >
              {subtitle}
            </span>
          </span>
        </button>

        {!isGroup && (
          <>
            <button
              type="button"
              onClick={() => onStartCall("audio")}
              aria-label="Voice call"
              className={cn(ICON_BTN, "hidden sm:flex")}
            >
              <Phone className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => onStartCall("video")}
              aria-label="Video call"
              className={ICON_BTN}
            >
              <Video className="size-5" />
            </button>
          </>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={cn(ICON_BTN, menuOpen && "bg-surface-muted text-fg")}
          >
            <MoreVertical className="size-5" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              aria-label="Chat options"
              className="absolute top-12 right-0 z-(--z-dropdown) w-56 rounded-lg border border-border bg-surface-raised p-1.5 shadow-lg"
            >
              {!isGroup && (
                <button
                  type="button"
                  role="menuitem"
                  className={cn(MENU_ITEM, "sm:hidden")}
                  onClick={() => {
                    setMenuOpen(false);
                    onStartCall("audio");
                  }}
                >
                  <Phone className="size-4 text-fg-muted" />
                  Voice call
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                className={MENU_ITEM}
                onClick={() => {
                  setMenuOpen(false);
                  onToggleSearch(true);
                }}
              >
                <Search className="size-4 text-fg-muted" />
                Search in chat
              </button>
              <button
                type="button"
                role="menuitem"
                className={MENU_ITEM}
                onClick={() => {
                  setMenuOpen(false);
                  onOpenInfo();
                }}
              >
                <Info className="size-4 text-fg-muted" />
                {isGroup ? "Group info" : "Chat info"}
              </button>
              {!isGroup && p.username && (
                <Link
                  href={`/@${p.username}`}
                  role="menuitem"
                  className={MENU_ITEM}
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="size-4 text-fg-muted" />
                  View profile
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 pb-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
            />
            <Input
              autoFocus
              type="search"
              aria-label="Search messages in this chat"
              placeholder="Search this chat"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="rounded-full border-transparent bg-surface-muted pl-10 [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
          <button
            type="button"
            aria-label="Close search"
            onClick={() => {
              onSearchChange("");
              onToggleSearch(false);
            }}
            className={ICON_BTN}
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </header>
  );
}
