"use client";

import {
  ArrowUp,
  Flame,
  Heart,
  History,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Pin,
  Reply,
  VenetianMask,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  detectMentionTrigger,
  MentionSuggestions,
  type TriggerContext,
} from "@/components/ui/mention-autocomplete";
import { RichText } from "@/components/ui/rich-text";
import type { FeedPost } from "@/hooks/use-feed";
import { useProfile } from "@/hooks/use-profile";
import { voteComment } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

export interface FastComment {
  id: string;
  postId: string;
  authorId?: string | null;
  pseudonym?: string | null;
  parentId?: string | null;
  replyToUserId?: string | null;
  imageUrl?: string | null;
  body: string;
  isAnonymous: boolean;
  status: string;
  isPinned?: boolean;
  likesCount?: number;
  repliesCount?: number;
  hasLiked?: boolean;
  createdAt: string | Date;
  replyToUser?: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    points?: number | null;
  } | null;
}

interface FastCommentsModalProps {
  post: FeedPost;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (newCount: number) => void;
}

const fetcher = <T,>(url: string): Promise<T> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch comments");
    return res.json() as Promise<T>;
  });

export function FastCommentsModal({ post, isOpen, onClose, onCommentCountChange }: FastCommentsModalProps) {
  const { profile } = useProfile();
  const [mounted, setMounted] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [sortMode, setSortMode] = useState<"best" | "latest">("best");
  const [mentionTrigger, setMentionTrigger] = useState<TriggerContext | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    handle: string;
    displayName: string;
  } | null>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // SSR portal mount flag
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background body scroll to prevent feed jitter and flicker
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  function toggleExpandReplies(commentId: string) {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  }

  // Initialize liked comments from localStorage & sync from server data
  useEffect(() => {
    try {
      const stored = localStorage.getItem("campusloop_liked_comments");
      if (stored) {
        setLikedComments(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const {
    data: comments,
    mutate,
    isLoading,
  } = useSWR<FastComment[]>(isOpen ? `/api/posts/${post.id}/comments` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 6000,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (comments && comments.length > 0) {
      setLikedComments((prev) => {
        const next = { ...prev };
        for (const c of comments) {
          if (typeof c.hasLiked === "boolean") {
            next[c.id] = c.hasLiked;
          }
        }
        return next;
      });
    }
  }, [comments]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  function handleComposerFocus() {
    setTimeout(scrollToBottom, 250);
  }

  async function handleUploadCommentFiles(files: File[]) {
    const validImageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (validImageFiles.length === 0) return;

    setIsUploadingImage(true);
    try {
      toast.loading("Uploading photo…", { id: "comment-img" });
      const uploaded = await uploadImageToImgBB(validImageFiles[0]);
      const imgMarkdown = `\n![Image](${uploaded.displayUrl || uploaded.url})`;
      setCommentText((prev) => `${prev.trim()}${imgMarkdown}`);
      toast.success("Photo added", { id: "comment-img" });
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload the photo. Try a smaller one.", {
        id: "comment-img",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const files = Array.from(clipboardData.files || []);
    const directImageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (directImageFiles.length > 0) {
      e.preventDefault();
      handleUploadCommentFiles(directImageFiles);
      return;
    }

    const items = Array.from(clipboardData.items || []);
    const itemImageFiles = items
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);

    if (itemImageFiles.length > 0) {
      e.preventDefault();
      handleUploadCommentFiles(itemImageFiles);
      return;
    }

    const html = clipboardData.getData("text/html");
    if (html) {
      const imgRegex = new RegExp("<" + 'img[^>]+src="([^">]+)"', "i");
      const match = html.match(imgRegex);
      if (match && match[1] && /^https?:\/\//i.test(match[1])) {
        const imgSrc = match[1];
        if (
          /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(imgSrc) ||
          imgSrc.includes("giphy.com") ||
          imgSrc.includes("tenor.com")
        ) {
          e.preventDefault();
          const imgMarkdown = `\n![Image](${imgSrc})`;
          setCommentText((prev) => `${prev.trim()}${imgMarkdown}`);
          toast.success("Media attached");
          setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
        }
      }
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setCommentText(val);
    const cursor = e.target.selectionStart ?? val.length;
    setMentionTrigger(detectMentionTrigger(val, cursor));
  }

  function handleSelectSuggestion(replacement: string, trigger: TriggerContext) {
    const before = commentText.slice(0, trigger.startIndex);
    const after = commentText.slice(trigger.endIndex);
    const newText = `${before}${replacement}${after}`;
    setCommentText(newText);
    setMentionTrigger(null);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
        const newPos = before.length + replacement.length;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  // Keyboard navigation & escape listener without forced layout scroll jump
  useEffect(() => {
    if (!isOpen) {
      setCommentText("");
      setReplyingTo(null);
      return;
    }
    const finePointer = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
    let focusTimer: NodeJS.Timeout | undefined;
    if (finePointer) {
      focusTimer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 150);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => {
      if (focusTimer) clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleToggleLike = async (commentId: string) => {
    sounds.tap();
    haptics.light();
    const currentlyLiked = Boolean(likedComments[commentId]);
    const nextLiked = !currentlyLiked;

    setLikedComments((prev) => {
      const next = { ...prev, [commentId]: nextLiked };
      try {
        localStorage.setItem("campusloop_liked_comments", JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const res = await voteComment(post.id, commentId);
      if (res) {
        setLikedComments((prev) => ({ ...prev, [commentId]: res.hasLiked }));
        mutate();
      }
    } catch {
      // Revert on error
      setLikedComments((prev) => ({ ...prev, [commentId]: currentlyLiked }));
    }
  };

  function handleStartReply(c: FastComment, handle: string, displayName: string) {
    sounds.tap();
    haptics.light();
    setReplyingTo({ id: c.id, handle, displayName });
    inputRef.current?.focus();
  }

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || isSubmitting) return;

    const currentReplyingTo = replyingTo;
    const parentComment = (comments || []).find((c) => c.id === currentReplyingTo?.id);
    const replyToUserId = parentComment?.authorId || undefined;

    const tempId = `temp-${Date.now()}`;
    const optimisticComment: FastComment = {
      id: tempId,
      postId: post.id,
      parentId: currentReplyingTo?.id || null,
      replyToUserId: replyToUserId || null,
      authorId: isAnonymous ? null : profile?.id || null,
      pseudonym: isAnonymous ? "anon_student" : null,
      body: text,
      isAnonymous,
      status: "PUBLISHED",
      isPinned: false,
      likesCount: 0,
      repliesCount: 0,
      hasLiked: false,
      createdAt: new Date().toISOString(),
      author: isAnonymous
        ? null
        : {
            id: profile?.id || "",
            username: profile?.username || "you",
            displayName: profile?.displayName || "You",
            avatarUrl: profile?.avatarUrl || null,
            points: profile?.points || profile?.loopPoints || 0,
          },
    };

    const currentList = comments || [];
    const updatedList = [...currentList, optimisticComment];

    sounds.send();
    haptics.success();
    mutate(updatedList, false);
    setCommentText("");
    setReplyingTo(null);
    setIsSubmitting(true);
    onCommentCountChange?.(updatedList.length);
    setTimeout(scrollToBottom, 60);

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: text,
          isAnonymous,
          parentId: currentReplyingTo?.id || undefined,
          replyToUserId,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error || "Couldn't post your comment. Try again.");
      }

      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't post your comment. Try again.");
      mutate(currentList, false);
      onCommentCountChange?.(currentList.length);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const authorHandle = post.isAnonymous ? post.pseudonym || "anonymous" : post.author?.username || "student";

  // Clean, markdown-free caption snippet for the minimal context bar
  const cleanSnippet = useMemo(() => {
    if (!post.body) return null;
    const clean = post.body
      .replace(/!\[.*?\]\(.*?\)/gi, "")
      .replace(/https?:\/\/[^\s]+/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return clean.length > 0 ? clean : null;
  }, [post.body]);

  const postAuthorId = post.authorId;

  // Group comments into root comments and nested replies (2-level flat tree)
  const { rootComments, repliesMap, totalCount } = useMemo(() => {
    const list = comments || [];
    const commentMap = new Map<string, FastComment>();
    for (const c of list) commentMap.set(c.id, c);

    function findRootId(startId: string): string {
      let curr = startId;
      const visited = new Set<string>();
      while (curr && !visited.has(curr)) {
        visited.add(curr);
        const p = commentMap.get(curr);
        if (!p || !p.parentId) return curr;
        curr = p.parentId;
      }
      return startId;
    }

    const roots: FastComment[] = [];
    const replies = new Map<string, FastComment[]>();

    for (const c of list) {
      if (c.parentId) {
        const rootId = findRootId(c.parentId);
        const existing = replies.get(rootId) || [];
        existing.push(c);
        replies.set(rootId, existing);
      } else {
        roots.push(c);
      }
    }

    if (sortMode === "latest") {
      roots.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // "best": pinned first, OP boost, durable likes, points
      roots.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        const isOpA = Boolean(postAuthorId && a.authorId === postAuthorId);
        const isOpB = Boolean(postAuthorId && b.authorId === postAuthorId);
        const scoreA =
          (isOpA ? 1000 : 0) + (a.likesCount || 0) * 10 + ((a.author?.points || 0) >= 150 ? 50 : 0);
        const scoreB =
          (isOpB ? 1000 : 0) + (b.likesCount || 0) * 10 + ((b.author?.points || 0) >= 150 ? 50 : 0);

        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return { rootComments: roots, repliesMap: replies, totalCount: list.length };
  }, [comments, sortMode, postAuthorId]);

  const displayCount = comments !== undefined ? totalCount : (post.commentsCount ?? 0);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 bg-overlay"
            onClick={onClose}
          />

          {/* Minimalist Mobile-First Bottom Drawer / Desktop Centered Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fast-comments-title"
            className="relative z-10 flex h-[84dvh] sm:h-[580px] max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-xl sm:rounded-xl bg-surface-raised text-fg shadow-lg sm:max-w-lg"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* ─── Mobile Drag Indicator ─── */}
            <div className="w-full flex items-center justify-center pt-2.5 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* ─── Minimal Header ─── */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <h3 id="fast-comments-title" className="text-lg">
                  Comments
                </h3>
                <span className="text-xs font-semibold text-fg-subtle bg-surface-muted px-2 py-0.5 rounded-full">
                  {displayCount}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort Toggle Button */}
                <button
                  type="button"
                  onClick={() => setSortMode((prev) => (prev === "best" ? "latest" : "best"))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-muted hover:bg-surface-muted border border-border text-xs font-semibold text-fg-subtle transition-colors cursor-pointer"
                  title="Change sort order"
                >
                  {sortMode === "best" ? (
                    <>
                      <Flame className="size-3 text-warning" />
                      <span>Top</span>
                    </>
                  ) : (
                    <>
                      <History className="size-3 text-brand-text" />
                      <span>Newest</span>
                    </>
                  )}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="size-10 rounded-full bg-surface-muted hover:bg-surface-muted text-fg-subtle hover:text-fg flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close comments"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* ─── Ultra-Compact Context Line (Clean & Mobile First) ─── */}
            {cleanSnippet && (
              <div className="px-4 py-2 border-b border-border bg-surface-muted flex items-center gap-2 text-xs text-fg-subtle shrink-0">
                <span className="font-semibold text-fg-subtle shrink-0">@{authorHandle}:</span>
                <span className="truncate">{cleanSnippet}</span>
              </div>
            )}

            {/* ─── Scrollable Comments Thread List ─── */}
            <div
              ref={scrollContainerRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-4 scroll-smooth"
            >
              {isLoading && (!comments || comments.length === 0) ? (
                <div className="space-y-3.5 pt-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse pt-1">
                      <div className="size-8 rounded-full bg-surface-muted/80 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-28 bg-surface-muted/70 rounded-md" />
                        <div className="h-3.5 w-3/4 bg-surface-muted/50 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : rootComments.length === 0 ? (
                <EmptyState
                  size="compact"
                  icon={MessageCircle}
                  title="No comments yet"
                  description="Say something first."
                  className="h-full justify-center"
                />
              ) : (
                rootComments.map((rootComment) => {
                  const childReplies = repliesMap.get(rootComment.id) || [];
                  const isExpanded = Boolean(expandedReplies[rootComment.id]);
                  const visibleReplies =
                    isExpanded || childReplies.length <= 1 ? childReplies : childReplies.slice(0, 1);
                  const remainingCount = childReplies.length - visibleReplies.length;

                  return (
                    <div key={rootComment.id} className="space-y-2.5">
                      <CommentRowItem
                        comment={rootComment}
                        onReply={handleStartReply}
                        onToggleLike={handleToggleLike}
                        isLiked={Boolean(likedComments[rootComment.id])}
                        currentUserId={profile?.id}
                        postAuthorId={post.authorId}
                        onClose={onClose}
                      />

                      {/* Nested Replies with Subtle Connector Line */}
                      {visibleReplies.length > 0 && (
                        <div className="mt-2 pl-3 ml-3 border-l-2 border-border space-y-2.5">
                          {visibleReplies.map((reply) => (
                            <CommentRowItem
                              key={reply.id}
                              comment={reply}
                              isReply
                              onReply={handleStartReply}
                              onToggleLike={handleToggleLike}
                              isLiked={Boolean(likedComments[reply.id])}
                              currentUserId={profile?.id}
                              postAuthorId={post.authorId}
                              onClose={onClose}
                            />
                          ))}

                          {/* Accordion expand button */}
                          {remainingCount > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleExpandReplies(rootComment.id)}
                              className="flex items-center gap-2 py-1 text-xs font-semibold text-fg-subtle hover:text-fg transition-colors cursor-pointer"
                            >
                              <div className="w-4 h-[1.5px] bg-border" />
                              <span>
                                View {remainingCount} more {remainingCount === 1 ? "reply" : "replies"}
                              </span>
                            </button>
                          )}

                          {isExpanded && childReplies.length > 1 && (
                            <button
                              type="button"
                              onClick={() => toggleExpandReplies(rootComment.id)}
                              className="flex items-center gap-2 py-1 text-xs font-semibold text-fg-subtle hover:text-fg transition-colors cursor-pointer"
                            >
                              <div className="w-4 h-[1.5px] bg-border" />
                              <span>Hide replies</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ─── Bottom Composer Bar (Mobile First & Pinned Above Keyboard) ─── */}
            <div className="p-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] border-t border-border bg-surface shrink-0 space-y-2">
              {/* Replying Context Banner */}
              {replyingTo && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-brand-subtle/40 border border-brand-subtle-border/20 text-xs">
                  <span className="text-fg-subtle text-xs font-medium flex items-center gap-1.5">
                    <Reply className="size-3 text-brand-text shrink-0" />
                    <span>
                      Replying to <strong className="text-fg">@{replyingTo.handle}</strong>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="size-5 rounded-full hover:bg-surface-muted flex items-center justify-center text-fg-subtle hover:text-fg cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}

              {!profile ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-surface-muted w-full">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-fg">Sign in to comment</p>
                    <p className="text-xs text-fg-subtle">Use your college email to reply and like.</p>
                  </div>
                  <Link
                    href={`/sign-in?returnTo=${typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : ""}`}
                    className={buttonVariants({ size: "sm", className: "shrink-0" })}
                  >
                    Sign in
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Current User Avatar */}
                  <Avatar className="size-8 rounded-full border border-border shrink-0">
                    <AvatarImage src={isAnonymous ? "" : profile?.avatarUrl || ""} />
                    <AvatarFallback className="text-xs font-bold bg-surface-muted text-fg-subtle">
                      {isAnonymous ? (
                        <VenetianMask className="size-4 text-brand-text" />
                      ) : (
                        profile?.displayName?.[0] || "U"
                      )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Input Capsule */}
                  <div className="relative flex-1 flex items-center gap-2 rounded-full border border-border bg-surface-muted focus-within:border-brand-subtle-border/40 focus-within:bg-surface px-3.5 py-1.5 transition-colors">
                    <MentionSuggestions
                      trigger={mentionTrigger}
                      onSelect={handleSelectSuggestion}
                      onClose={() => setMentionTrigger(null)}
                      className="bottom-full mb-2 left-0"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) handleUploadCommentFiles(files);
                      }}
                    />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={
                        replyingTo
                          ? `Reply to @${replyingTo.handle}…`
                          : isAnonymous
                            ? "Comment anonymously…"
                            : "Add a comment…"
                      }
                      value={commentText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onPaste={handlePaste}
                      onFocus={handleComposerFocus}
                      enterKeyHint="send"
                      className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-muted outline-none"
                      maxLength={500}
                    />

                    {/* Photo Attachment Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="text-fg-subtle hover:text-fg transition-colors p-1 cursor-pointer disabled:opacity-40"
                      title="Attach photo"
                      aria-label="Attach photo"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="size-4 animate-spin text-brand-text" />
                      ) : (
                        <ImageIcon className="size-4" />
                      )}
                    </button>

                    {/* Anonymous Toggle Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        haptics.light();
                        const next = !isAnonymous;
                        setIsAnonymous(next);
                        toast.info(next ? "Commenting anonymously" : "Commenting publicly");
                      }}
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
                        isAnonymous
                          ? "bg-brand-subtle/80 text-brand-text border border-brand-subtle-border/40"
                          : "text-fg-subtle hover:text-fg"
                      )}
                      title={isAnonymous ? "Anonymous comment" : "Public comment"}
                    >
                      <VenetianMask className="size-3.5" />
                      <span>{isAnonymous ? "Anon" : "Public"}</span>
                    </button>
                  </div>

                  {/* Send Button */}
                  <button
                    type="button"
                    disabled={!commentText.trim() || isSubmitting}
                    onClick={handleSendComment}
                    className={cn(
                      "size-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-md",
                      commentText.trim() && !isSubmitting
                        ? "bg-primary text-primary-foreground hover:bg-primary/95 active:scale-90 shadow-primary/25"
                        : "bg-muted text-muted-foreground/50 cursor-not-allowed"
                    )}
                    aria-label="Send comment"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowUp className="size-4 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// Single Comment Row Component
// ─────────────────────────────────────────────────────────────

function CommentRowItem({
  comment,
  isReply = false,
  onReply,
  onToggleLike,
  isLiked,
  currentUserId,
  postAuthorId,
  onClose,
}: {
  comment: FastComment;
  isReply?: boolean;
  onReply: (c: FastComment, handle: string, displayName: string) => void;
  onToggleLike: (id: string) => void;
  isLiked: boolean;
  currentUserId?: string | null;
  postAuthorId?: string | null;
  onClose: () => void;
}) {
  const isAnon = comment.isAnonymous;
  const cDisplayName = isAnon ? "Anonymous Student" : comment.author?.displayName || "Student";
  const cHandle = isAnon ? comment.pseudonym || "anonymous" : comment.author?.username || "student";
  const cAvatar = isAnon
    ? ""
    : getAvatarUrl(comment.author?.avatarUrl, comment.author?.username ?? "student");
  const isCurrentUser = currentUserId && comment.authorId === currentUserId;
  const isOP = postAuthorId && comment.authorId === postAuthorId;

  return (
    <div className={cn("flex items-start gap-2.5 group", isReply ? "text-xs" : "")}>
      {isAnon ? (
        <div
          className={cn(
            "rounded-full bg-brand-subtle/50 border border-brand-subtle-border/30 flex items-center justify-center shrink-0 text-brand-text mt-0.5",
            isReply ? "size-7" : "size-8"
          )}
        >
          <VenetianMask className={isReply ? "size-3.5" : "size-4"} />
        </div>
      ) : (
        <Link href={`/@${cHandle}`} onClick={onClose} className="shrink-0 mt-0.5">
          <Avatar
            className={cn(
              "rounded-full border border-border hover:opacity-90 transition-opacity",
              isReply ? "size-7" : "size-8"
            )}
          >
            <AvatarImage src={cAvatar} />
            <AvatarFallback className="text-xs font-bold bg-surface-muted text-fg-subtle">
              {cDisplayName[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isAnon ? (
              <span className="text-xs font-semibold text-fg truncate">{cDisplayName}</span>
            ) : (
              <Link
                href={`/@${cHandle}`}
                onClick={onClose}
                className="text-xs font-semibold text-fg truncate hover:underline hover:text-fg transition-colors"
              >
                {cDisplayName}
              </Link>
            )}

            {isCurrentUser && (
              <span className="text-xs font-bold bg-brand-subtle/80 text-brand-text border border-brand-subtle-border/30 px-1.5 py-0.2 rounded-md">
                You
              </span>
            )}
            {isOP && !isCurrentUser && (
              <span className="text-xs font-bold bg-brand-subtle/80 text-brand-text border border-brand-subtle-border/30 px-1.5 py-0.2 rounded-md">
                Author
              </span>
            )}

            <span className="text-xs text-fg-muted">{formatTimeAgo(comment.createdAt)}</span>
          </div>

          {/* Pinned by Author Badge */}
          {comment.isPinned && !isReply && (
            <div className="flex items-center gap-1 text-xs font-semibold text-warning bg-warning/10 rounded px-1.5 py-0.5 border border-warning/20 w-fit shrink-0">
              <Pin className="size-2.5 fill-warning/30 rotate-45" />
              <span>Pinned</span>
            </div>
          )}
        </div>

        {/* Replying to indicator */}
        {comment.replyToUser && (
          <div className="text-xs text-fg-subtle font-medium">
            Replying to <span className="text-fg font-semibold">@{comment.replyToUser.username}</span>
          </div>
        )}

        {/* Comment text with embeds disabled so user profiles / post embeds don't inflate inside comments */}
        <div className="text-[13px] text-fg leading-relaxed break-words font-normal select-text">
          <RichText content={comment.body} disableEmbeds={true} />
        </div>

        {/* Attached image preview */}
        {comment.imageUrl && (
          <div className="mt-1.5 max-w-xs rounded-xl overflow-hidden border border-border">
            <img
              src={comment.imageUrl}
              alt="Attachment"
              className="max-h-48 w-full object-cover rounded-xl"
              loading="lazy"
            />
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center gap-4 pt-0.5">
          <button
            type="button"
            onClick={() => onToggleLike(comment.id)}
            className="flex items-center gap-1 text-xs font-medium text-fg-subtle hover:text-danger transition-colors cursor-pointer"
          >
            <Heart
              className={cn(
                "size-3.5 transition-transform active:scale-125",
                isLiked ? "fill-danger text-danger" : "text-fg-muted"
              )}
            />
            {(() => {
              const base = comment.likesCount || 0;
              const count = base + (isLiked && !comment.hasLiked ? 1 : !isLiked && comment.hasLiked ? -1 : 0);
              return count > 0 ? (
                <span className="tabular-nums text-xs text-danger font-bold">{count}</span>
              ) : null;
            })()}
          </button>

          {!isReply && (
            <button
              type="button"
              onClick={() => onReply(comment, cHandle, cDisplayName)}
              className="text-xs font-medium text-fg-subtle hover:text-fg transition-colors cursor-pointer"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
