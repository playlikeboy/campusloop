"use client";

import { ArrowDown, MessageCircle, SearchX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { ActiveCallOverlay } from "@/components/calls/active-call-overlay";
import { IncomingCallModal } from "@/components/calls/incoming-call-modal";
import { VoiceRecorderModal } from "@/components/media/voice-recorder-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { GifPickerModal } from "@/components/ui/gif-picker-modal";
import { Spinner } from "@/components/ui/spinner";
import { StickerPickerModal } from "@/components/ui/sticker-picker-modal";
import { triggerBrowserNotification } from "@/hooks/use-push-notifications";
import {
  type CachedMessage,
  getCachedMessages,
  setCachedMessages,
  updateCachedConversationLastMessage,
} from "@/lib/chat-cache";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { ChatComposer } from "./chat-composer";
import {
  buildReplyBody,
  type ChatParticipant,
  DELETED_FOR_EVERYONE_BODY,
  DELETED_FOR_ME_BODY,
  previewText,
  splitQuote,
} from "./chat-format";
import { ChatDeleteMessageDialog, ChatMessageOptionsDialog } from "./chat-message-dialogs";
import { ChatMessageList, ChatThreadEmpty } from "./chat-message-list";
import { ThreadBubblesSkeleton, ThreadSkeleton } from "./chat-skeletons";
import { ChatThreadHeader } from "./chat-thread-header";
import { ChatUserInfoDrawer } from "./chat-user-info-drawer";
import { useChatCalls } from "./use-chat-calls";
import { useChatMedia } from "./use-chat-media";
import { useMentionSuggestions } from "./use-mention-suggestions";

const PAGE = 35;

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<T>;
};

interface MessengerPaneProps {
  conversationId: string | null;
  otherParticipant: ChatParticipant | null;
  currentUserId: string;
  /** Whether this chat is muted, from the inbox row. */
  isMuted?: boolean;
  onBack?: () => void;
}

/** The open conversation: header, messages, composer, plus calls and message dialogs. */
export function MessengerPane({
  conversationId,
  otherParticipant,
  currentUserId,
  isMuted = false,
  onBack,
}: MessengerPaneProps) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CachedMessage | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [optionsMsg, setOptionsMsg] = useState<CachedMessage | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<CachedMessage | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const initialScrollDone = useRef(false);
  const lastSeenMsgId = useRef<string | null>(null);

  // Fetch the conversation header when the inbox didn't pass the participant (deep link).
  const { data: convData } = useSWR<{ otherParticipant: ChatParticipant }>(
    conversationId && !otherParticipant ? `/api/chat/${conversationId}` : null,
    fetcher,
    { dedupingInterval: 8000 }
  );
  const participant = otherParticipant || convData?.otherParticipant || null;
  const isGroupChat = Boolean(participant?.isGroup || participant?.isCommunity);

  const {
    data: messages,
    error: messagesError,
    isLoading,
    mutate,
  } = useSWR<CachedMessage[]>(
    conversationId ? `/api/chat/${conversationId}/messages?limit=${PAGE}` : null,
    fetcher,
    {
      fallbackData: (conversationId && getCachedMessages(conversationId)) || undefined,
      refreshInterval: 2000,
      revalidateOnFocus: true,
      onSuccess: (data) => {
        if (conversationId && data) setCachedMessages(conversationId, data);
      },
    }
  );

  const calls = useChatCalls({
    currentUserId,
    conversationId,
    receiverId: participant && !isGroupChat ? participant.id : null,
  });
  const mentions = useMentionSuggestions(draft, textareaRef);

  useEffect(() => {
    setHasOlder(true);
    setLoadingOlder(false);
    setShowJump(false);
    setReplyingTo(null);
    setSearchOpen(false);
    setSearchQuery("");
    initialScrollDone.current = false;
  }, [conversationId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !conversationId) return;
      setIsSending(true);
      const body = buildReplyBody(replyingTo, text);
      const optimistic: CachedMessage = {
        id: `temp-${Date.now()}`,
        conversationId,
        senderId: currentUserId,
        body,
        readAt: null,
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        optimistic: true,
      } as CachedMessage;

      setReplyingTo(null);
      sounds.send();
      haptics.success();
      mutate((prev) => {
        const next = [...(prev || []), optimistic];
        setCachedMessages(conversationId, next);
        return next;
      }, false);
      updateCachedConversationLastMessage(conversationId, {
        id: optimistic.id,
        body,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
      });

      try {
        const res = await fetch(`/api/chat/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        if (!res.ok) throw new Error("send failed");
      } catch {
        toast.error("Message didn't send. Check your connection and try again.");
      } finally {
        mutate();
        setIsSending(false);
      }
    },
    [conversationId, currentUserId, replyingTo, mutate]
  );

  const media = useChatMedia(conversationId, sendMessage);

  const loadOlder = useCallback(async () => {
    if (!conversationId || loadingOlder || !hasOlder || !messages?.length) return;
    setLoadingOlder(true);
    const container = scrollRef.current;
    const prevHeight = container?.scrollHeight || 0;
    try {
      const before = new Date(messages[0].createdAt).toISOString();
      const res = await fetch(
        `/api/chat/${conversationId}/messages?limit=${PAGE}&before=${encodeURIComponent(before)}`
      );
      if (!res.ok) return;
      const older = (await res.json()) as CachedMessage[];
      if (older.length < PAGE) setHasOlder(false);
      if (older.length === 0) return;
      const ids = new Set(older.map((m) => m.id));
      mutate([...older, ...messages.filter((m) => !ids.has(m.id))], false);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevHeight;
      });
    } catch {
      // Scrolling up again retries.
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, loadingOlder, hasOlder, messages, mutate]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior, block: "end" });
    setShowJump(false);
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 96);
    if (el.scrollTop < 60 && (messages?.length || 0) >= PAGE) void loadOlder();
  }, [loadOlder, messages]);

  // Stick to the bottom on new messages unless the reader scrolled up or is searching.
  useEffect(() => {
    if (searchQuery.trim() || !messages) return;
    if (!initialScrollDone.current) {
      scrollToBottom("auto");
      initialScrollDone.current = true;
      return;
    }
    const el = scrollRef.current;
    if (!el || el.scrollHeight - el.scrollTop - el.clientHeight < 180) scrollToBottom("smooth");
  }, [messages, searchQuery, scrollToBottom]);

  // Sound + browser notification when a new message arrives from the other side.
  useEffect(() => {
    if (!messages?.length) return;
    const last = messages[messages.length - 1];
    if (lastSeenMsgId.current && lastSeenMsgId.current !== last.id && last.senderId !== currentUserId) {
      sounds.pop();
      haptics.light();
      if (document.visibilityState === "hidden") {
        triggerBrowserNotification(participant?.displayName || "New message", {
          body: previewText(last.body),
          url: `/chat/${conversationId}`,
        });
      }
    }
    lastSeenMsgId.current = last.id;
  }, [messages, currentUserId, participant, conversationId]);

  const toggleReaction = useCallback(
    async (msgId: string, emoji: string) => {
      if (!conversationId) return;
      sounds.pop();
      haptics.medium();
      mutate(
        (prev) =>
          prev?.map((m) => {
            if (m.id !== msgId) return m;
            const current = m.reactions || [];
            const exists = current.some((r) => r.userId === currentUserId && r.emoji === emoji);
            const reactions = exists
              ? current.filter((r) => !(r.userId === currentUserId && r.emoji === emoji))
              : [...current.filter((r) => r.userId !== currentUserId), { emoji, userId: currentUserId }];
            return { ...m, reactions };
          }),
        false
      );
      try {
        const res = await fetch(`/api/chat/${conversationId}/messages/${msgId}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        if (!res.ok) throw new Error("react failed");
      } catch {
        toast.error("Reaction didn't save. Try again.");
      } finally {
        mutate();
      }
    },
    [conversationId, currentUserId, mutate]
  );

  const deleteMessage = useCallback(
    async (msgId: string, scope: "everyone" | "me") => {
      if (!conversationId) return;
      sounds.pop();
      haptics.heavy();
      setDeleteMsg(null);
      mutate(
        (prev) =>
          prev?.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  body: scope === "everyone" ? DELETED_FOR_EVERYONE_BODY : DELETED_FOR_ME_BODY,
                  reactions: [],
                }
              : m
          ),
        false
      );
      try {
        const res = await fetch(`/api/chat/${conversationId}/messages/${msgId}?deleteFor=${scope}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("delete failed");
        toast.success(scope === "everyone" ? "Deleted for everyone" : "Deleted for you");
      } catch {
        toast.error("Couldn't delete that message. Try again.");
      } finally {
        mutate();
      }
    },
    [conversationId, mutate]
  );

  const copyMessage = useCallback((msg: CachedMessage) => {
    void navigator.clipboard?.writeText(splitQuote(msg.body).text).then(
      () => toast.success("Copied"),
      () => toast.error("Couldn't copy. Long-press the text to select it instead.")
    );
    setOptionsMsg(null);
  }, []);

  const startReply = useCallback((msg: CachedMessage) => {
    setReplyingTo(msg);
    textareaRef.current?.focus();
  }, []);

  const startCall = (type: "audio" | "video") => {
    if (!participant) return;
    void calls.startCall(type, {
      id: participant.id,
      displayName: participant.displayName || "Student",
      avatarUrl: participant.avatarUrl,
      username: participant.username || undefined,
    });
  };

  // Calls render in a portal so they still show while this pane is hidden (phone inbox view).
  const callUi =
    (calls.incomingCall || calls.activeCall) && typeof document !== "undefined"
      ? createPortal(
          <>
            {calls.incomingCall && !calls.activeCall && (
              <IncomingCallModal
                incomingCall={calls.incomingCall}
                onAccept={calls.acceptIncoming}
                onDecline={() => void calls.declineIncoming()}
              />
            )}
            {calls.activeCall && (
              <ActiveCallOverlay
                callId={calls.activeCall.callId}
                isCaller={calls.activeCall.isCaller}
                type={calls.activeCall.type}
                partner={calls.activeCall.partner}
                remotePeerId={calls.activeCall.remotePeerId}
                onCallEnded={calls.endActiveCall}
              />
            )}
          </>,
          document.body
        )
      : null;

  if (!conversationId) {
    return (
      <>
        <EmptyState
          className="h-full"
          icon={MessageCircle}
          title="Pick a chat"
          description="Choose someone on the left, or search to start a new chat."
        />
        {callUi}
      </>
    );
  }

  if (!participant) {
    return (
      <>
        <ThreadSkeleton />
        {callUi}
      </>
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const shown = query ? messages?.filter((m) => m.body.toLowerCase().includes(query)) : messages;
  const replyName =
    replyingTo?.senderId === currentUserId
      ? "yourself"
      : replyingTo?.sender?.displayName || participant.displayName;

  let content: React.ReactNode;
  if (!messages && (isLoading || !messagesError)) {
    content = <ThreadBubblesSkeleton />;
  } else if (!messages && messagesError) {
    content = (
      <EmptyState
        icon={MessageCircle}
        title="Messages didn't load"
        description="Check your connection. We'll keep trying."
      />
    );
  } else if (query && shown?.length === 0) {
    content = (
      <EmptyState
        size="compact"
        icon={SearchX}
        title="No messages match"
        description="Try a different word."
      />
    );
  } else if (!shown?.length) {
    content = <ChatThreadEmpty name={participant.displayName} onSend={(t) => void sendMessage(t)} />;
  } else {
    content = (
      <ChatMessageList
        messages={shown}
        currentUserId={currentUserId}
        isGroupChat={isGroupChat}
        onReact={toggleReaction}
        onReply={startReply}
        onOptions={setOptionsMsg}
      />
    );
  }

  return (
    <div className="chat-surface relative flex h-full w-full flex-col overflow-hidden">
      <ChatThreadHeader
        participant={participant}
        onBack={onBack}
        onOpenInfo={() => setShowInfo(true)}
        onStartCall={startCall}
        searchOpen={searchOpen}
        onToggleSearch={setSearchOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div
        ref={scrollRef}
        onScroll={onScroll}
        onDragOver={(e) => e.preventDefault()}
        onDrop={media.handleDrop}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-6"
      >
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end">
          {loadingOlder && (
            <div role="status" className="flex items-center justify-center gap-2 py-2 text-xs text-fg-muted">
              <Spinner size="xs" /> Loading older messages
            </div>
          )}
          {content}
          <div ref={endRef} />
        </div>
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          aria-label="Jump to latest messages"
          className="absolute right-4 bottom-24 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-fg shadow-lg transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowDown className="size-5" />
        </button>
      )}

      <ChatComposer
        textareaRef={textareaRef}
        value={draft}
        onChange={setDraft}
        onSend={(t) => void sendMessage(t)}
        onPaste={media.handlePaste}
        sending={isSending}
        uploading={media.uploading}
        replyingTo={replyingTo}
        replyName={replyName}
        onCancelReply={() => setReplyingTo(null)}
        mentionSuggestions={mentions.suggestions}
        onPickMention={(u) => setDraft(mentions.insert(draft, u))}
        onImage={(f) => void media.sendImage(f)}
        onVideo={(f) => void media.sendVideo(f)}
        onDocument={(f) => void media.sendDocument(f)}
        onGif={() => setShowGif(true)}
        onSticker={() => setShowStickers(true)}
        onVoice={() => {
          sounds.tap();
          haptics.light();
          setShowVoice(true);
        }}
      />

      <ChatMessageOptionsDialog
        msg={optionsMsg}
        onClose={() => setOptionsMsg(null)}
        onReact={toggleReaction}
        onReply={startReply}
        onCopy={copyMessage}
        onDelete={(m) => {
          setOptionsMsg(null);
          setDeleteMsg(m);
        }}
      />
      <ChatDeleteMessageDialog
        msg={deleteMsg}
        currentUserId={currentUserId}
        onClose={() => setDeleteMsg(null)}
        onConfirm={(id, scope) => void deleteMessage(id, scope)}
      />

      <GifPickerModal
        isOpen={showGif}
        onClose={() => setShowGif(false)}
        onSelectGif={(url) => void sendMessage(url)}
      />
      <StickerPickerModal
        isOpen={showStickers}
        onClose={() => setShowStickers(false)}
        onSelectSticker={(sticker) => void sendMessage(sticker.url)}
      />
      <VoiceRecorderModal
        isOpen={showVoice}
        onClose={() => setShowVoice(false)}
        onAudioRecorded={(url, duration) => void media.sendVoiceNote(url, duration)}
      />

      <ChatUserInfoDrawer
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        otherParticipant={participant}
        conversationId={conversationId}
        messages={messages || []}
        currentUserId={currentUserId}
        isMuted={isMuted}
        onSearchClick={() => setSearchOpen(true)}
        onClearChat={() => mutate(undefined, true)}
        onDeleteChat={onBack}
        onStartCall={startCall}
      />

      {callUi}
    </div>
  );
}
