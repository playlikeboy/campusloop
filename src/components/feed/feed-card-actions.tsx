"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AnimateBookmark,
  AnimatedIcon,
  AnimateHeart,
  AnimateMessageCircle,
  AnimateRepeat2,
  AnimateShare,
  useIconHandle,
} from "@/components/ui/animated-icon";
import type { FeedPost } from "@/hooks/use-feed";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface FeedCardActionsProps {
  post: FeedPost;
  userVote: number;
  votesCount: number;
  commentsCount?: number;
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
  onVote,
  onInstantRepost,
  onShare,
  onOpenComments,
  onOpenLikes,
}: FeedCardActionsProps) {
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

  function triggerRepostAnimation(e: React.MouseEvent) {
    e.stopPropagation();
    if (hasReposted) return;

    setRepostSpin(true);
    setHasReposted(true);
    sounds.tap();
    haptics.light();
    setTimeout(() => setRepostSpin(false), 320);
    onInstantRepost();
  }

  async function handleToggleSave(e: React.MouseEvent) {
    e.stopPropagation();
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
      className="flex items-center justify-between pt-2 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Floating Reaction Capsule (Matching Reference Mockup) */}
      <div className="neo-reaction-pill">
        {/* Like / Heart Action */}
        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.8 }}
            type="button"
            onClick={onVote}
            {...like.handlers}
            className={cn(
              "flex items-center gap-1 text-xs cursor-pointer group transition-colors",
              isLiked ? "text-rose-500 font-bold" : "text-muted-foreground hover:text-rose-500"
            )}
            aria-label={isLiked ? "Unlike post" : "Like post"}
          >
            <AnimatedIcon
              ref={like.ref}
              icon={AnimateHeart}
              animation="beat"
              size={15}
              animateOnHover={false}
              playKey={isLiked}
              iconClassName={cn(
                "transition-colors",
                isLiked ? "fill-rose-500 text-rose-500" : "text-muted-foreground group-hover:text-rose-500"
              )}
            />
            <span
              onClick={(e) => {
                if (effectiveVotesCount > 0) {
                  e.stopPropagation();
                  onOpenLikes?.();
                }
              }}
              className="tabular-nums text-xs font-bold"
            >
              {effectiveVotesCount > 0 ? effectiveVotesCount : 0}
            </span>
          </motion.button>
        </div>

        {/* Reply Action */}
        <button
          type="button"
          onClick={onOpenComments}
          {...reply.handlers}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          aria-label="Reply"
        >
          <AnimatedIcon
            ref={reply.ref}
            icon={AnimateMessageCircle}
            animation="pop"
            size={15}
            animateOnHover={false}
          />
          <span className="tabular-nums text-xs font-bold">
            {displayCommentsCount ?? 0}
          </span>
        </button>

        {/* Share Action */}
        <button
          type="button"
          onClick={onShare}
          {...share.handlers}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          aria-label="Share"
        >
          <AnimatedIcon
            ref={share.ref}
            icon={AnimateShare}
            animation="nudge-up"
            size={14}
            animateOnHover={false}
          />
          <span className="tabular-nums text-xs font-bold">
            {(post as any)?.sharesCount || (post as any)?.repostsCount || "Share"}
          </span>
        </button>
      </div>

      {/* Right Side Utility Actions: Repost & Bookmark */}
      <div className="flex items-center gap-1">
        {/* Repost Action */}
        <button
          type="button"
          onClick={triggerRepostAnimation}
          {...repost.handlers}
          aria-pressed={hasReposted}
          className={cn(
            "size-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
            hasReposted
              ? "text-emerald-500 bg-emerald-500/10"
              : "text-muted-foreground hover:text-emerald-500 hover:bg-muted/50"
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

        {/* Save / Bookmark Action */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          type="button"
          onClick={handleToggleSave}
          {...bookmark.handlers}
          className={cn(
            "size-8 rounded-full flex items-center justify-center transition-colors cursor-pointer",
            isSaved
              ? "text-amber-500 bg-amber-500/10"
              : "text-muted-foreground hover:text-amber-500 hover:bg-muted/50"
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
