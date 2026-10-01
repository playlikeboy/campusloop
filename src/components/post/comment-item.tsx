"use client";

import { Copy, Link2, MoreHorizontal, Pin, Sparkles, User, VenetianMask } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AnimatedIcon,
  AnimateHeart,
  AnimateMessageCircle,
  AnimateShieldCheck,
  useIconHandle,
} from "@/components/ui/animated-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  detectMentionTrigger,
  MentionSuggestions,
  type TriggerContext,
} from "@/components/ui/mention-autocomplete";
import { RichText } from "@/components/ui/rich-text";
import type { Comment } from "@/db/schema";
import { pinComment, voteComment } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

export type CommentWithAuthor = Omit<Comment, "createdAt" | "updatedAt"> & {
  createdAt: Date | string;
  updatedAt?: Date | string;
  likesCount?: number;
  repliesCount?: number;
  isPinned?: boolean;
  hasLiked?: boolean;
  imageUrl?: string | null;
  replyToUserId?: string | null;
  replyToUser?: {
    id?: string;
    username?: string | null;
    displayName?: string | null;
  } | null;
  author: {
    id?: string;
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
    points?: number | null;
    institutionId?: string | null;
  } | null;
};

interface CommentItemProps {
  comment: CommentWithAuthor;
  postId?: string;
  depth?: number;
  isPostAuthor?: boolean;
  canPin?: boolean;
  hasReplies?: boolean;
  onReply: (id: string) => void;
  replyingToId: string | null;
  replyBody: string;
  setReplyBody: (v: string) => void;
  setReplyingToId: (v: string | null) => void;
  replyIsAnon: boolean;
  setReplyIsAnon: (v: boolean) => void;
  isSubmitting: boolean;
  submitReply: (parentId: string) => void;
}

export function CommentItem({
  comment,
  postId,
  depth = 0,
  isPostAuthor = false,
  canPin = false,
  hasReplies = false,
  onReply,
  replyingToId,
  replyBody,
  setReplyBody,
  setReplyingToId,
  replyIsAnon,
  setReplyIsAnon,
  isSubmitting,
  submitReply,
}: CommentItemProps) {
  const [liked, setLiked] = useState(Boolean(comment.hasLiked));
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [isPinned, setIsPinned] = useState(Boolean(comment.isPinned));
  const [showMenu, setShowMenu] = useState(false);
  const [replyMentionTrigger, setReplyMentionTrigger] = useState<TriggerContext | null>(null);
  const [lastTap, setLastTap] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);
  const reply = useIconHandle();
  const like = useIconHandle();

  useEffect(() => {
    setLiked(Boolean(comment.hasLiked));
    setLikesCount(comment.likesCount || 0);
    setIsPinned(Boolean(comment.isPinned));
  }, [comment.hasLiked, comment.likesCount, comment.isPinned]);

  const isAnon = comment.isAnonymous;
  const displayName = isAnon ? "Anonymous Student" : comment.author?.displayName || "Student";
  const handle = isAnon ? comment.pseudonym || "anonymous" : comment.author?.username || "student";
  const fallback: React.ReactNode = isAnon ? (
    <VenetianMask className="size-4 text-purple-400" />
  ) : (
    (comment.author?.displayName?.[0] ?? "S").toUpperCase()
  );
  const avatarUrl = isAnon
    ? ""
    : getAvatarUrl(comment.author?.avatarUrl, comment.author?.username ?? "student");
  const isVerified = Boolean(!isAnon && (comment.author?.points || 0) >= 150);

  const isReplying = replyingToId === comment.id;

  async function handleToggleLike() {
    const nextLiked = !liked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setLiked(nextLiked);
    setLikesCount(nextCount);

    if (nextLiked) {
      sounds.pop();
      haptics.medium();
    } else {
      sounds.tap();
      haptics.light();
    }

    const targetPostId = postId || comment.postId;
    if (!targetPostId) return;

    try {
      const res = await voteComment(targetPostId, comment.id);
      if (res && typeof res.likesCount === "number") {
        setLikesCount(res.likesCount);
        setLiked(res.hasLiked);
      }
    } catch {
      // Revert on failure
      setLiked(liked);
      setLikesCount(likesCount);
      toast.error("Failed to update reaction");
    }
  }

  // Instagram-style double tap to like
  function handleDoubleTap() {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (!liked) {
        handleToggleLike();
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
    }
    setLastTap(now);
  }

  async function handleTogglePin() {
    setShowMenu(false);
    const targetPostId = postId || comment.postId;
    if (!targetPostId) return;

    try {
      const res = await pinComment(targetPostId, comment.id);
      setIsPinned(res.isPinned);
      toast.success(res.isPinned ? "Comment pinned to top 📌" : "Comment unpinned");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle pin state");
    }
  }

  async function handleCopyCommentLink() {
    const targetPostId = postId || comment.postId;
    if (!targetPostId) {
      toast.error("Unable to find post identifier");
      return;
    }
    const commentUrl = `https://campusloop.space/post/${targetPostId}/comment/${comment.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(commentUrl);
        toast.success("Comment link copied to clipboard");
      } catch {
        toast.error("Failed to copy comment link");
      }
    } else {
      toast.error("Clipboard not supported");
    }
  }

  function handleReplyInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setReplyBody(val);
    const cursor = e.target.selectionStart ?? val.length;
    setReplyMentionTrigger(detectMentionTrigger(val, cursor));
  }

  function handleSelectReplySuggestion(replacement: string, trigger: TriggerContext) {
    const before = replyBody.slice(0, trigger.startIndex);
    const after = replyBody.slice(trigger.endIndex);
    const newText = `${before}${replacement}${after}`;
    setReplyBody(newText);
    setReplyMentionTrigger(null);
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
        const newPos = before.length + replacement.length;
        replyInputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  return (
    <div className="relative group select-text" onClick={handleDoubleTap}>
      {/* Pinned indicator banner */}
      {isPinned && depth === 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1 mb-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg w-fit border border-amber-500/20">
          <Pin className="size-3 fill-amber-500/30 rotate-45 shrink-0" />
          <span>Pinned by author</span>
        </div>
      )}

      {/* Threads Vertical Thread Connector Line */}
      {hasReplies && depth === 0 && (
        <div className="absolute left-4.5 top-11 bottom-0 w-0.5 bg-border/50 -z-0" />
      )}

      <div
        className={cn(
          "flex gap-3 py-3 text-foreground transition-colors relative",
          depth > 0 &&
            "pl-8 sm:pl-10 before:absolute before:left-3.5 before:top-0 before:bottom-6 before:w-0.5 before:bg-border/40"
        )}
      >
        {/* Double-tap heart burst effect */}
        {showHeartBurst && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-50 duration-200">
            <div className="p-3 bg-black/40 backdrop-blur-md rounded-full shadow-2xl">
              <AnimatedIcon
                icon={AnimateHeart}
                animation="beat"
                size={36}
                className="fill-rose-500 text-rose-500"
              />
            </div>
          </div>
        )}

        {/* Avatar */}
        <div className="shrink-0 relative z-10">
          {!isAnon ? (
            <Link href={`/@${handle}`}>
              <Avatar className="size-9 rounded-full border border-border/40 hover:opacity-90 transition-opacity">
                <AvatarImage src={avatarUrl || ""} />
                <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                  {fallback}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="size-9 rounded-full border border-border/40 bg-muted">
              <AvatarFallback className="text-xs font-bold">{fallback}</AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Comment Body & Header */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap text-[13px] leading-none">
              {!isAnon ? (
                <Link href={`/@${handle}`} className="font-bold text-foreground hover:underline truncate">
                  {displayName}
                </Link>
              ) : (
                <span className="font-bold text-foreground truncate">{displayName}</span>
              )}

              {isVerified && (
                <AnimatedIcon
                  icon={AnimateShieldCheck}
                  animation="pop"
                  size={14}
                  className="text-brand shrink-0"
                />
              )}

              {/* OP / Author Badge */}
              {isPostAuthor && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-black text-primary border border-primary/20">
                  OP
                </span>
              )}

              <span className="text-xs text-muted-foreground truncate">@{handle}</span>

              <span className="text-muted-foreground/60">·</span>

              <span className="text-xs text-muted-foreground/70 shrink-0">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>

            {/* Options Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                className="size-7 rounded-full hover:bg-muted text-muted-foreground/50 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Comment options"
              >
                <MoreHorizontal className="size-3.5" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div
                    className="absolute right-0 mt-1 w-48 rounded-xl border border-border/50 bg-popover text-popover-foreground shadow-xl z-30 py-1 animate-in fade-in zoom-in-95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Pin/Unpin option for author/admin */}
                    {canPin && depth === 0 && (
                      <button
                        type="button"
                        onClick={handleTogglePin}
                        className="w-full text-left px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Pin className="size-3.5 text-amber-500 rotate-45" />
                        <span>{isPinned ? "Unpin comment" : "Pin comment to top"}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        handleCopyCommentLink();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Link2 className="size-3.5 text-brand" />
                      <span>Copy link to comment</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setShowMenu(false);
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          try {
                            await navigator.clipboard.writeText(comment.body || "");
                            toast.success("Comment text copied to clipboard");
                          } catch {
                            toast.error("Failed to copy text");
                          }
                        }
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Copy className="size-3.5 text-muted-foreground" />
                      <span>Copy text</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Replying to indicator */}
          {comment.replyToUser && (
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <span>Replying to</span>
              <span className="text-primary font-semibold">@{comment.replyToUser.username}</span>
            </div>
          )}

          {/* Comment Content */}
          <div className="text-[14px] leading-relaxed text-foreground break-words font-normal">
            <RichText content={comment.body} />
          </div>

          {/* Attached Image Preview */}
          {comment.imageUrl && (
            <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-border/50 bg-black/5">
              <img
                src={comment.imageUrl}
                alt="Comment attachment"
                className="max-h-72 w-full object-cover rounded-xl hover:opacity-95 transition-opacity cursor-pointer"
                loading="lazy"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(comment.imageUrl || "", "_blank");
                }}
              />
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-6 pt-1 text-xs text-muted-foreground select-none">
            {/* Reply Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sounds.tap();
                haptics.light();
                if (isReplying) {
                  setReplyingToId(null);
                } else {
                  onReply(comment.id);
                  setReplyBody(`@${handle} `);
                }
              }}
              {...reply.handlers}
              className="flex items-center gap-1.5 hover:text-brand transition-colors cursor-pointer group/reply"
            >
              <div className="size-7 rounded-full group-hover/reply:bg-brand/10 flex items-center justify-center transition-colors">
                <AnimatedIcon
                  ref={reply.ref}
                  icon={AnimateMessageCircle}
                  animation="pop"
                  size={15}
                  animateOnHover={false}
                />
              </div>
              <span className="text-[11px] font-semibold">Reply</span>
            </button>

            {/* Like / Heart Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLike();
              }}
              {...like.handlers}
              className={cn(
                "flex items-center gap-1.5 transition-colors cursor-pointer group/like",
                liked ? "text-rose-500" : "hover:text-rose-500"
              )}
            >
              <div className="size-7 rounded-full group-hover/like:bg-rose-500/10 flex items-center justify-center transition-colors">
                <AnimatedIcon
                  ref={like.ref}
                  icon={AnimateHeart}
                  animation="beat"
                  size={15}
                  animateOnHover={false}
                  playKey={liked}
                  iconClassName={cn(
                    "transition-colors",
                    liked
                      ? "fill-rose-500 text-rose-500"
                      : "text-muted-foreground group-hover/like:text-rose-500"
                  )}
                />
              </div>
              {likesCount > 0 && <span className="text-[11px] font-semibold">{likesCount}</span>}
            </button>

            {/* Copy link to comment / Share Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyCommentLink();
              }}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-brand transition-colors cursor-pointer group/share"
              title="Copy link to comment"
              aria-label="Copy link to comment"
            >
              <div className="size-7 rounded-full group-hover/share:bg-brand/10 flex items-center justify-center transition-colors">
                <Link2 className="size-3.5 text-muted-foreground group-hover/share:text-brand transition-colors" />
              </div>
              <span className="text-[11px] font-semibold">Share</span>
            </button>
          </div>

          {/* Inline Reply Composer */}
          {isReplying && (
            <div className="relative pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
              <MentionSuggestions
                trigger={replyMentionTrigger}
                onSelect={handleSelectReplySuggestion}
                onClose={() => setReplyMentionTrigger(null)}
                className="bottom-full mb-2 left-0"
              />

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-2.5">
                <p className="text-[11px] text-muted-foreground font-medium">
                  Replying to <span className="text-primary font-bold">@{handle}</span>
                </p>

                <textarea
                  ref={replyInputRef}
                  value={replyBody}
                  onChange={handleReplyInputChange}
                  placeholder="Post your reply..."
                  rows={2}
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none resize-none leading-relaxed"
                  autoFocus
                />

                <div className="flex items-center justify-between pt-1 border-t border-border/30">
                  <button
                    type="button"
                    onClick={() => setReplyIsAnon(!replyIsAnon)}
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer inline-flex items-center gap-1",
                      replyIsAnon
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                        : "bg-muted/60 text-muted-foreground"
                    )}
                  >
                    {replyIsAnon ? (
                      <>
                        <VenetianMask className="size-3 text-purple-500" />
                        <span>Anon</span>
                      </>
                    ) : (
                      <>
                        <User className="size-3" />
                        <span>Public</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="px-3 py-1 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !replyBody.trim()}
                      onClick={() => {
                        sounds.send();
                        haptics.medium();
                        submitReply(comment.id);
                      }}
                      className="px-3.5 py-1 rounded-full bg-foreground text-background text-xs font-black disabled:opacity-40 hover:opacity-90 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
