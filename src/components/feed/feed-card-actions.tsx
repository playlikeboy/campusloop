"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type AuthRequiredAction, notifyAuthRequired } from "@/components/auth/auth-required-overlay";
import {
  AnimateBookmark,
  AnimatedIcon,
  AnimateFlame,
  AnimateMessageCircle,
  AnimateRepeat2,
  AnimateShare,
  useIconHandle,
} from "@/components/ui/animated-icon";
import type { FeedPost } from "@/hooks/use-feed";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface FeedCardActionsProps {
  post: FeedPost;
  userVote: number;
  votesCount: number;
  commentsCount?: number;
  currentUserId?: string;
  onVote: () => void;
  onInstantRepost: () => void;
  onShare: () => void;
  onOpenComments?: () => void;
  onOpenLikes?: () => void;
}

export function FeedCardActions({
  post,
  userVote,
  votesCount,
  commentsCount,
  currentUserId,
  onVote,
  onInstantRepost,
  onShare,
  onOpenComments,
  onOpenLikes,
}: FeedCardActionsProps) {
  const { profile } = useProfile();
  const isAuthenticated = Boolean(currentUserId || profile?.userId);
  const [repostSpin, setRepostSpin] = useState(false);
  const [hasReposted, setHasReposted] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));

  useEffect(() => {
    setIsSaved(Boolean(post.isSaved));
  }, [post.isSaved]);

  const reply = useIconHandle();
  const repost = useIconHandle();
  const like = useIconHandle();
  const bookmark = useIconHandle();
  const share = useIconHandle();
  const displayCommentsCount = commentsCount ?? post.commentsCount;

  function requireAuth(action: AuthRequiredAction, callback: () => void) {
    if (!isAuthenticated) {
      notifyAuthRequired(action);
      return;
    }
    callback();
  }

  function triggerRepostAnimation(e: React.MouseEvent) {
    e.stopPropagation();
    requireAuth("repost", () => {
      if (hasReposted) return;
      setRepostSpin(true);
      setHasReposted(true);
      setTimeout(() => setRepostSpin(false), 320);
      onInstantRepost();
    });
  }

  async function handleToggleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isAuthenticated) {
      notifyAuthRequired("save");
      return;
    }

    const nextState = !isSaved;
    setIsSaved(nextState);
    sounds.pop();
    haptics.light();

    try {
      const res = await fetch(`/api/posts/${post.id}/save`, {
        method: nextState ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error("Failed to update save status");
      if (nextState) {
        toast.success("Saved");
      } else {
        toast.info("Removed from saved");
      }
    } catch {
      setIsSaved(!nextState);
      toast.error("Couldn't save. Try again.");
    }
  }

  const isLiked = userVote === 1;
  const effectiveVotesCount = isLiked && votesCount <= 0 ? 1 : votesCount;

  return (
    <div
      className="-ml-2.5 flex items-center justify-between select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex min-w-0 items-center gap-0.5">
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.82 }}
            type="button"
            onClick={() => requireAuth("like", onVote)}
            {...like.handlers}
            className={cn(
              "cl-interactive flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-2.5 text-xs cursor-pointer group transition-colors hover:bg-surface-muted active:scale-95",
              isLiked ? "text-brand-text" : "text-fg-muted hover:text-brand-text"
            )}
            aria-pressed={isLiked}
            aria-label={
              isLiked
                ? `Liked, ${effectiveVotesCount} likes. Tap to unlike`
                : `Like, ${effectiveVotesCount} likes`
            }
          >
            <motion.div
              animate={
                isLiked
                  ? { scale: [1, 1.45, 0.9, 1.15, 1], rotate: [0, -10, 10, -5, 0] }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.42, ease: [0.175, 0.885, 0.32, 1.275] }}
            >
              <AnimatedIcon
                ref={like.ref}
                icon={AnimateFlame}
                animation="pop"
                size={16}
                animateOnHover={false}
                playKey={isLiked}
                iconClassName={cn(
                  "transition-colors",
                  isLiked ? "fill-brand text-brand-text" : "text-fg-muted group-hover:text-brand-text"
                )}
              />
            </motion.div>
            <span
              onClick={(e) => {
                if (effectiveVotesCount > 0) {
                  e.stopPropagation();
                  onOpenLikes?.();
                }
              }}
              title={effectiveVotesCount > 0 ? "See who liked this" : "Like"}
              className="tabular-nums text-[13px] font-medium"
            >
              {effectiveVotesCount > 0 ? effectiveVotesCount : ""}
            </span>
          </motion.button>
        </div>

        <button
          type="button"
          onClick={() => requireAuth("comment", () => onOpenComments?.())}
          {...reply.handlers}
          className="cl-interactive flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-2.5 text-xs text-fg-muted hover:bg-surface-muted hover:text-fg transition-ui group cursor-pointer active:scale-95"
          aria-label={displayCommentsCount ? `Comments, ${displayCommentsCount}` : "Comment"}
        >
          <AnimatedIcon
            ref={reply.ref}
            icon={AnimateMessageCircle}
            animation="pop"
            size={16}
            animateOnHover={false}
          />
          <span className="tabular-nums text-[13px] font-medium">
            {displayCommentsCount ? displayCommentsCount : ""}
          </span>
        </button>

        <button
          type="button"
          onClick={onShare}
          {...share.handlers}
          className="cl-interactive flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-2.5 text-xs text-fg-muted hover:bg-surface-muted hover:text-fg transition-ui group cursor-pointer active:scale-95"
          aria-label="Share"
        >
          <AnimatedIcon
            ref={share.ref}
            icon={AnimateShare}
            animation="nudge-up"
            size={15}
            animateOnHover={false}
          />
          <span className="tabular-nums text-[13px] font-medium">
            {(post as any)?.sharesCount || (post as any)?.repostsCount || ""}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={triggerRepostAnimation}
          {...repost.handlers}
          aria-pressed={hasReposted}
          className={cn(
            "cl-interactive size-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-ui cursor-pointer active:scale-95",
            hasReposted
              ? "text-brand-text bg-brand-subtle"
              : "text-fg-muted hover:text-fg hover:bg-surface-muted"
          )}
          aria-label={hasReposted ? "Reposted" : "Repost"}
        >
          <AnimatedIcon
            ref={repost.ref}
            icon={AnimateRepeat2}
            animation="nudge-right"
            size={16}
            animateOnHover={false}
            className={cn("transition-transform duration-300 ease-out", repostSpin && "rotate-180")}
            iconClassName={cn(hasReposted && "text-brand-text")}
          />
        </button>

        <motion.button
          whileTap={{ scale: 0.8 }}
          type="button"
          onClick={handleToggleSave}
          {...bookmark.handlers}
          className={cn(
            "cl-interactive size-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-ui cursor-pointer active:scale-95",
            isSaved ? "text-brand-text bg-brand-subtle" : "text-fg-muted hover:text-fg hover:bg-surface-muted"
          )}
          aria-pressed={isSaved}
          aria-label={isSaved ? "Saved. Tap to remove" : "Save post"}
        >
          <AnimatedIcon
            ref={bookmark.ref}
            icon={AnimateBookmark}
            animation="lift"
            size={16}
            animateOnHover={false}
            playKey={isSaved}
            iconClassName={cn("transition-colors", isSaved ? "fill-brand text-brand-text" : "text-fg-muted")}
          />
        </motion.button>
      </div>
    </div>
  );
}
