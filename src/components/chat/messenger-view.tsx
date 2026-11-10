"use client";

import { UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { type CachedConversation, getCachedConversations, setCachedConversations } from "@/lib/chat-cache";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { isGroupConversation } from "./chat-format";
import { ChatInboxHeader, type InboxFilter } from "./chat-inbox-header";
import { ChatActiveNow, ChatInboxList, ChatPeopleResults } from "./chat-inbox-list";
import { ConversationActionModal } from "./conversation-action-modal";
import { CreateGroupModal } from "./create-group-modal";
import { MessengerPane } from "./messenger-pane";
import { usePeopleSearch } from "./use-people-search";

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<T>;
};

interface MessengerViewProps {
  currentUserId: string;
  initialTargetUserId?: string;
  initialConversationId?: string;
}

/** Two-pane messenger: inbox on the left, open chat on the right (one pane at a time on phones). */
export function MessengerView({
  currentUserId,
  initialTargetUserId,
  initialConversationId,
}: MessengerViewProps) {
  const [activeId, setActiveId] = useState<string | null>(initialConversationId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("ALL");
  const [actionConv, setActionConv] = useState<CachedConversation | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const people = usePeopleSearch(searchQuery);

  // Keep state in sync when the route changes to another /chat/[id].
  useEffect(() => {
    if (initialConversationId) setActiveId(initialConversationId);
  }, [initialConversationId]);

  // Cached inbox renders instantly, then SWR polls so new messages show up.
  const initialCache = getCachedConversations();
  const {
    data: conversations,
    error,
    isLoading,
    mutate,
  } = useSWR<CachedConversation[]>("/api/chat", fetcher, {
    fallbackData: initialCache || undefined,
    refreshInterval: 2500,
    revalidateOnFocus: true,
    onSuccess: (data) => {
      if (data) setCachedConversations(data);
    },
  });

  // On desktop, opening /chat selects the newest chat.
  useEffect(() => {
    if (initialConversationId || activeId || !conversations?.length || window.innerWidth < 768) return;
    const firstId = conversations[0].id;
    setActiveId(firstId);
    window.history.replaceState(null, "", `/chat/${firstId}`);
  }, [conversations, activeId, initialConversationId]);

  // Browser back / forward.
  useEffect(() => {
    const onPop = () => {
      const match = window.location.pathname.match(/(?:\/app)?\/chat\/([^/]+)/);
      setActiveId(match ? match[1] : null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const selectConversation = useCallback((convId: string, withFeedback = true) => {
    if (withFeedback) {
      sounds.tap();
      haptics.light();
    }
    setActiveId(convId);
    window.history.pushState(null, "", `/chat/${convId}`);
  }, []);

  const backToInbox = useCallback(() => {
    setActiveId(null);
    window.history.pushState(null, "", "/chat");
  }, []);

  const startConversation = useCallback(
    async (participantId: string) => {
      setStartingId(participantId);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId }),
        });
        if (!res.ok) throw new Error("Failed to create conversation");
        const data = (await res.json()) as { id: string };
        setSearchQuery("");
        selectConversation(data.id);
        mutate();
      } catch {
        toast.error("Couldn't open this chat. Check your connection and try again.");
      } finally {
        setStartingId(null);
      }
    },
    [mutate, selectConversation]
  );

  // ?userId= opens (or starts) a chat with that person once.
  const handledTargetRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialTargetUserId || !conversations) return;
    if (handledTargetRef.current === initialTargetUserId) return;
    handledTargetRef.current = initialTargetUserId;
    const existing = conversations.find((c) => c.otherParticipant?.id === initialTargetUserId);
    if (existing) selectConversation(existing.id, false);
    else void startConversation(initialTargetUserId);
  }, [initialTargetUserId, conversations, startConversation, selectConversation]);

  // One row per direct participant; archived chats live in their own filter.
  const { visible, unreadCount, archivedCount } = useMemo(() => {
    const seen = new Set<string>();
    const deduped = (conversations || []).filter((c) => {
      if (isGroupConversation(c)) return true;
      const pid = c.otherParticipant?.id;
      if (!pid) return true;
      if (seen.has(pid)) return false;
      seen.add(pid);
      return true;
    });
    const active = deduped.filter((c) => !c.isArchived && c.otherParticipant);
    const byFilter: Record<InboxFilter, CachedConversation[]> = {
      ALL: active,
      UNREAD: active.filter((c) => (c.unreadCount || 0) > 0),
      GROUPS: active.filter(isGroupConversation),
      CAMPUS: active.filter((c) => Boolean(c.otherParticipant?.institutionId) && !isGroupConversation(c)),
      ARCHIVED: deduped.filter((c) => Boolean(c.isArchived) && c.otherParticipant),
    };
    return {
      visible: byFilter[filter],
      unreadCount: byFilter.UNREAD.length,
      archivedCount: byFilter.ARCHIVED.length,
    };
  }, [conversations, filter]);

  const activeConv = conversations?.find((c) => c.id === activeId);
  const searching = searchQuery.trim().length > 0;

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg">
      <aside
        aria-label="Chats"
        className={cn(
          "relative h-full w-full shrink-0 flex-col overflow-hidden border-r border-border bg-surface md:w-80 lg:w-96",
          activeId ? "hidden md:flex" : "flex"
        )}
      >
        <ChatInboxHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filter={filter}
          onFilterChange={setFilter}
          unreadCount={unreadCount}
          archivedCount={archivedCount}
        >
          {!searching && filter === "ALL" && conversations && (
            <ChatActiveNow conversations={conversations} onSelect={selectConversation} />
          )}
        </ChatInboxHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {searching ? (
            <ChatPeopleResults
              query={searchQuery}
              results={people.results}
              loading={people.loading}
              failed={people.failed}
              startingId={startingId}
              onPick={(id) => void startConversation(id)}
            />
          ) : (
            <ChatInboxList
              conversations={visible}
              loading={!conversations && isLoading}
              failed={Boolean(error)}
              filter={filter}
              activeId={activeId}
              currentUserId={currentUserId}
              onSelect={selectConversation}
              onOpenActions={setActionConv}
              onRetry={() => mutate()}
              onShowAll={() => setFilter("ALL")}
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.tap();
            haptics.medium();
            setShowCreateGroup(true);
          }}
          className="fab-bubble absolute right-4 bottom-[calc(1rem+var(--nav-mobile-h,0px)+env(safe-area-inset-bottom))] z-20 flex h-13 cursor-pointer items-center gap-2 px-5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:bottom-5"
        >
          <UserPlus className="size-5" aria-hidden="true" />
          <span>New group</span>
        </button>
      </aside>

      <section
        aria-label="Conversation"
        className={cn(
          "h-full min-w-0 flex-1 flex-col overflow-hidden bg-bg",
          activeId ? "flex" : "hidden md:flex"
        )}
      >
        <MessengerPane
          conversationId={activeId}
          otherParticipant={activeConv ? activeConv.otherParticipant : null}
          currentUserId={currentUserId}
          isMuted={Boolean(activeConv?.isMuted)}
          onBack={backToInbox}
        />
      </section>

      <ConversationActionModal
        isOpen={actionConv !== null}
        onClose={() => setActionConv(null)}
        conversation={actionConv}
        currentUserId={currentUserId}
        onActionComplete={() => mutate()}
        onDeleteConversation={(convId) => {
          if (activeId === convId) backToInbox();
        }}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        currentUserId={currentUserId}
        onGroupCreated={(newConvId: string, createdConv?: CachedConversation) => {
          if (createdConv) {
            mutate((prev) => [createdConv, ...(prev || []).filter((c) => c.id !== newConvId)], false);
          } else {
            mutate();
          }
          selectConversation(newConvId);
        }}
      />
    </div>
  );
}
