"use client";

import { Archive, MailOpen, MessageCircle, SearchX, Users2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { UserProfile } from "@/db/schema";
import type { CachedConversation } from "@/lib/chat-cache";
import { isOnline } from "@/lib/presence";
import { ChatAvatar } from "./chat-avatar";
import type { InboxFilter } from "./chat-inbox-header";
import { ChatInboxRow } from "./chat-inbox-row";
import { ChatPersonRow } from "./chat-person-row";
import { InboxRowsSkeleton } from "./chat-skeletons";

const EMPTY_COPY: Record<InboxFilter, { title: string; description: string; icon: typeof MessageCircle }> = {
  ALL: {
    title: "No chats yet",
    description: "Search for a classmate to send your first message.",
    icon: MessageCircle,
  },
  UNREAD: { title: "You're all caught up", description: "No unread messages right now.", icon: MailOpen },
  GROUPS: {
    title: "No groups yet",
    description: "Start a group for your class, club or hostel.",
    icon: Users2,
  },
  CAMPUS: {
    title: "No chats with your college yet",
    description: "Search for someone from your college to say hi.",
    icon: MessageCircle,
  },
  ARCHIVED: { title: "Nothing archived", description: "Archived chats show up here.", icon: Archive },
};

interface PeopleResultsProps {
  query: string;
  results: UserProfile[];
  loading: boolean;
  failed: boolean;
  startingId: string | null;
  onPick: (userId: string) => void;
}

/** People search results that replace the inbox while the search box has text. */
export function ChatPeopleResults({
  query,
  results,
  loading,
  failed,
  startingId,
  onPick,
}: PeopleResultsProps) {
  if (loading && results.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-fg-muted" role="status">
        <Spinner size="sm" />
        <span>Searching…</span>
      </div>
    );
  }
  if (failed) {
    return (
      <EmptyState
        size="compact"
        icon={WifiOff}
        title="Search didn't load"
        description="Check your connection and try typing again."
      />
    );
  }
  if (results.length === 0) {
    return (
      <EmptyState
        size="compact"
        icon={SearchX}
        title={`No one found for "${query.trim()}"`}
        description="Try a first name or @username."
      />
    );
  }
  return (
    <ul className="space-y-0.5 p-2">
      {results.map((user) => (
        <li key={user.id}>
          <ChatPersonRow
            user={user}
            disabled={startingId !== null}
            onClick={() => onPick(user.id)}
            trailing={startingId === user.id ? <Spinner size="sm" /> : null}
          />
        </li>
      ))}
    </ul>
  );
}

/** Horizontal row of people who are online right now. Hidden when nobody is. */
export function ChatActiveNow({
  conversations,
  onSelect,
}: {
  conversations: CachedConversation[];
  onSelect: (id: string) => void;
}) {
  const online = conversations
    .filter((c) => !c.isGroup && !c.isCommunity && isOnline(c.otherParticipant?.lastSeenAt))
    .slice(0, 12);
  if (online.length === 0) return null;

  return (
    <section aria-label="Online now" className="space-y-1.5">
      <h2 className="text-sm font-semibold text-fg-muted">Online now</h2>
      <ul className="no-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 sm:-mx-4 sm:px-4">
        {online.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className="flex w-14 cursor-pointer flex-col items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChatAvatar
                name={c.otherParticipant.displayName}
                src={c.otherParticipant.avatarUrl}
                lastSeenAt={c.otherParticipant.lastSeenAt}
                showPresence
              />
              <span className="w-full truncate text-center text-xs text-fg">
                {c.otherParticipant.displayName.split(" ")[0]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface InboxListProps {
  conversations: CachedConversation[];
  loading: boolean;
  failed: boolean;
  filter: InboxFilter;
  activeId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
  onOpenActions: (conv: CachedConversation) => void;
  onRetry: () => void;
  onShowAll: () => void;
  /** Empty inbox: jump to the people search. */
  onFindPeople: () => void;
  /** Empty groups filter: open the new-group flow. */
  onNewGroup: () => void;
}

/** The conversation list with its loading, error and empty states. */
export function ChatInboxList({
  conversations,
  loading,
  failed,
  filter,
  activeId,
  currentUserId,
  onSelect,
  onOpenActions,
  onRetry,
  onShowAll,
  onFindPeople,
  onNewGroup,
}: InboxListProps) {
  if (loading) return <InboxRowsSkeleton />;

  if (failed && conversations.length === 0) {
    return (
      <EmptyState
        icon={WifiOff}
        title="Couldn't load your chats"
        description="Check your connection, then try again."
        action={
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  if (conversations.length === 0) {
    const copy = EMPTY_COPY[filter];
    return (
      <EmptyState
        icon={copy.icon}
        title={copy.title}
        description={copy.description}
        action={
          filter === "ALL" ? (
            <Button onClick={onFindPeople}>Find someone to message</Button>
          ) : filter === "GROUPS" ? (
            <Button onClick={onNewGroup}>New group</Button>
          ) : (
            <Button variant="secondary" onClick={onShowAll}>
              Show all chats
            </Button>
          )
        }
      />
    );
  }

  return (
    <ul className="space-y-0.5 p-2 pb-[calc(var(--nav-mobile-h)+env(safe-area-inset-bottom)+5.5rem)] lg:pb-24">
      {conversations.map((conv) => (
        <li key={conv.id}>
          <ChatInboxRow
            conversation={conv}
            currentUserId={currentUserId}
            selected={conv.id === activeId}
            onSelect={onSelect}
            onOpenActions={onOpenActions}
          />
        </li>
      ))}
    </ul>
  );
}
