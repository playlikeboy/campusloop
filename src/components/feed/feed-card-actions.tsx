"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AnimateBookmark,
  AnimatedIcon,
  AnimateFlame,
  AnimateMessageCircle,
  AnimateRepeat2,
  AnimateShare,
  useIconHandle,
} from "@/components/ui/animated-icon";
import { notifyAuthRequired, type AuthRequiredAction } from "@/components/auth/auth-required-overlay";
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
        toast.success("Saved to campus vault");
      } else {
        toast.info("Removed from saved posts");
      }
    } catch {
      setIsSaved(!nextState);
      toast.error("Could not update bookmark");
    }
  }

  const isLiked = userVote === 1;
  const effectiveVotesCount = isLiked && votesCount <= 0 ? 1 : votesCount;

  return (
    <div
      className="flex items-center justify-between border-t border-border/25 pt-1.5 select-none"
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
              "cl-interactive flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs cursor-pointer group transition-colors hover:bg-muted/70 active:scale-95",
              isLiked ? "text-orange-500 font-bold" : "text-muted-foreground hover:text-orange-500"
            )}
            aria-label={isLiked ? `${effectiveVotesCount} Vibes, tap to unvibe` : `Vibe post, currently ${effectiveVotesCount} vibes`}
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
                  isLiked
                    ? "fill-orange-500 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                    : "text-muted-foreground group-hover:text-orange-500"
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
              title={effectiveVotesCount > 0 ? `${effectiveVotesCount} Vibes` : "Vibe"}
              className="tabular-nums text-xs font-bold"
            >
              {effectiveVotesCount > 0 ? effectiveVotesCount : 0}
            </span>
          </motion.button>
        </div>

        <button
          type="button"
          onClick={() => requireAuth("comment", () => onOpenComments?.())}
          {...reply.handlers}
          className="cl-interactive flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors group cursor-pointer active:scale-95"
          aria-label="Reply"
        >
          <AnimatedIcon ref={reply.ref} icon={AnimateMessageCircle} animation="pop" size={16} animateOnHover={false} />
          <span className="tabular-nums text-xs font-bold">{displayCommentsCount ?? 0}</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          {...share.handlers}
          className="cl-interactive flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors group cursor-pointer active:scale-95"
          aria-label="Share"
        >
          <AnimatedIcon ref={share.ref} icon={AnimateShare} animation="nudge-up" size={15} animateOnHover={false} />
          <span className="tabular-nums text-xs font-bold">{(post as any)?.sharesCount || (post as any)?.repostsCount || "Share"}</span>
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={triggerRepostAnimation}
          {...repost.handlers}
          aria-pressed={hasReposted}
          className={cn(
            "cl-interactive size-11 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors cursor-pointer active:scale-95",
            hasReposted ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:text-emerald-500 hover:bg-muted/50"
          )}
          aria-label={hasReposted ? "Reposted" : "Repost"}
        >
          <AnimatedIcon
            ref={repost.ref}
            icon={AnimateRepeat2}
            animation="nudge-right"
            size={16}
            animateOnHover={false}
            className={cn("transition-transform duration-300 ease-out", repostSpin && "rotate-180 scale-115")}
            iconClassName={cn(hasReposted && "text-emerald-500")}
          />
        </button>

        <motion.button
          whileTap={{ scale: 0.8 }}
          type="button"
          onClick={handleToggleSave}
          {...bookmark.handlers}
          className={cn(
            "cl-interactive size-11 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors cursor-pointer active:scale-95",
            isSaved ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:text-amber-500 hover:bg-muted/50"
          )}
          aria-label={isSaved ? "Saved in vault" : "Save post"}
        >
          <AnimatedIcon
            ref={bookmark.ref}
            icon={AnimateBookmark}
            animation="lift"
            size={16}
            animateOnHover={false}
            playKey={isSaved}
            iconClassName={cn(
              "transition-colors",
              isSaved ? "fill-amber-500 text-amber-500" : "text-muted-foreground hover:text-amber-500"
            )}
          />
        </motion.button>
      </div>
    </div>
  );
}
