"use client";

import { Archive, Menu, Search, Users2, X } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export type InboxFilter = "ALL" | "UNREAD" | "GROUPS" | "CAMPUS" | "ARCHIVED";

const FILTERS: { id: InboxFilter; label: string; icon?: React.ReactNode }[] = [
  { id: "ALL", label: "All" },
  { id: "UNREAD", label: "Unread" },
  { id: "GROUPS", label: "Groups", icon: <Users2 /> },
  { id: "CAMPUS", label: "My college" },
  { id: "ARCHIVED", label: "Archived", icon: <Archive /> },
];

interface ChatInboxHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  unreadCount: number;
  archivedCount: number;
  children?: React.ReactNode;
}

/** Inbox title, people search and filter chips. `children` renders between title and search. */
export function ChatInboxHeader({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  unreadCount,
  archivedCount,
  children,
}: ChatInboxHeaderProps) {
  const counts: Partial<Record<InboxFilter, number>> = {
    UNREAD: unreadCount || undefined,
    ARCHIVED: archivedCount || undefined,
  };

  return (
    <div className="shrink-0 space-y-3 border-b border-border p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            sounds.tap();
            haptics.light();
            window.dispatchEvent(new CustomEvent("campusloop_open_mobile_drawer"));
          }}
          className="-ml-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </button>
        <h1 className="font-display text-2xl font-extrabold text-fg">Chats</h1>
      </div>

      {children}

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
        />
        <Input
          id="chat-search-input"
          type="search"
          inputMode="search"
          autoComplete="off"
          aria-label="Search people to message"
          placeholder="Search people"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-full border-transparent bg-surface-muted pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui outline-none hover:bg-surface-sunken hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {!searchQuery && (
        <div
          role="toolbar"
          aria-label="Filter chats"
          className="no-scrollbar -mx-3 flex items-center gap-2 overflow-x-auto px-3 sm:-mx-4 sm:px-4"
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              size="sm"
              icon={f.icon}
              count={counts[f.id]}
              selected={filter === f.id}
              onClick={() => onFilterChange(f.id)}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
