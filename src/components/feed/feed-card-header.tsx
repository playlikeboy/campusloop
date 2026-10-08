"use client";

import { Archive, Bot, Copy, Edit3, ExternalLink, Flag, Link2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { archivePost, deletePost } from "@/app/(app)/(main)/post/actions";
import { RedditAttribution } from "@/components/reddit/reddit-attribution";
import {
  AnimatedIcon,
  AnimateRepeat2,
  AnimateShieldCheck,
  AnimateTrash2,
} from "@/components/ui/animated-icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { FeedPost } from "@/hooks/use-feed";
import { cn, formatTimeAgo, getCollegeShortName } from "@/lib/utils";

interface FeedCardHeaderProps {
  post: FeedPost;
  currentUserId?: string;
  onOpenRepostModal: () => void;
  onOpenReportModal: () => void;
  onShare: () => void;
  avatarSlot?: React.ReactNode;
}

export function FeedCardHeader({
  post,
  currentUserId,
  onOpenRepostModal,
  onOpenReportModal,
  onShare,
  avatarSlot,
}: FeedCardHeaderProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);

  async function handleToggleFollow(e: React.MouseEvent) {
    e.stopPropagation();
    if (!currentUserId || !post.author?.username || isFollowPending) return;
    const next = !isFollowing;
    setIsFollowing(next);
    setIsFollowPending(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(post.author.username)}/follow`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      if (next) {
        toast.success(`Following @${post.author.username}`);
      }
    } catch {
      setIsFollowing(!next);
    } finally {
      setIsFollowPending(false);
    }
  }

  async function handleToggleArchive() {
    setIsArchiving(true);
    setShowMenu(false);
    try {
      const res = await archivePost(post.id);
      toast.success(res.isArchived ? "Post moved to your private archive" : "Post restored to public feeds");
      router.refresh();
    } catch {
      toast.error("Failed to update post archive status");
    } finally {
      setIsArchiving(false);
    }
  }

  const isExternalReddit = Boolean(post.externalPost && post.externalPost.source === "reddit");
  const isBotPost = Boolean(
    post.pseudonym && (post.pseudonym.startsWith("🤖") || post.pseudonym.toLowerCase().includes("bot"))
  );
  const cleanBotPseudonym = post.pseudonym?.replace(/^[🤖\s]+/u, "").trim();

  const authorName = isBotPost
    ? cleanBotPseudonym || "Bot"
    : post.isAnonymous
      ? post.pseudonym
        ? `@${post.pseudonym}`
        : "Anonymous Student"
      : post.author?.displayName ||
        (isExternalReddit ? `r/${post.externalPost?.subreddit || "reddit"}` : "Student");

  const authorHandle = isBotPost
    ? cleanBotPseudonym
      ? `@${cleanBotPseudonym}`
      : "@bot"
    : post.isAnonymous
      ? null
      : post.author?.username
        ? `@${post.author.username}`
        : null;

  const isVerified = Boolean(
    !isBotPost && !post.isAnonymous && ((post.author?.points || 0) >= 150 || post.author?.role === "ADMIN")
  );

  const institutionDisplayName = getCollegeShortName(post.institution) || null;

  return (
    <div className="w-full min-w-0 pb-0.5 select-none">
      <div className="flex items-center gap-3 w-full min-w-0">
        {/* Author Avatar (fixed 40x40px) */}
        {avatarSlot && <div className="size-10 shrink-0">{avatarSlot}</div>}

      {/* Author Details + Badges */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {!isBotPost && !post.isAnonymous && post.author?.username ? (
            <Link
              href={`/@${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-[15px] text-foreground hover:underline truncate max-w-[160px] sm:max-w-[220px] shrink-0"
            >
              {authorName}
            </Link>
          ) : !post.isAnonymous && isExternalReddit ? (
            <a
              href={post.externalPost?.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-[15px] text-foreground hover:text-orange-500 hover:underline truncate max-w-[160px] sm:max-w-[220px] shrink-0"
            >
              {authorName}
            </a>
          ) : (
            <span className="font-bold text-[15px] text-foreground truncate max-w-[160px] sm:max-w-[220px] shrink-0">
              {authorName}
            </span>
          )}

          {isVerified && (
            <VerifiedBadge size="sm" />
          )}

          {!isBotPost && !post.isAnonymous && post.authorId && currentUserId && currentUserId !== post.authorId && post.author?.username && (
            <button
              type="button"
              onClick={handleToggleFollow}
              className={cn(
                "h-5 px-2 rounded-full text-[10px] font-semibold transition-all cursor-pointer shrink-0 active:scale-95",
                isFollowing
                  ? "bg-muted/60 text-muted-foreground hover:bg-muted/80 border border-border/40"
                  : "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/25"
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}

          {isBotPost && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 text-[9px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
              <Bot className="size-2.5" />
              <span>BOT</span>
            </span>
          )}

          {authorHandle && (
            <span className="text-muted-foreground text-xs truncate max-w-[90px] sm:max-w-[130px] shrink-0">
              {authorHandle}
            </span>
          )}

          {isExternalReddit && (
            <a
              href={post.externalPost?.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-[10px] font-bold shrink-0 transition-colors"
              title={`From r/${post.externalPost?.subreddit || "reddit"}`}
            >
              <span>r/{post.externalPost?.subreddit}</span>
              <ExternalLink className="size-2.5 opacity-70" />
            </a>
          )}
        </div>

        {/* Subtitle: College Tag · Timestamp · Tags */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 pt-0.5 flex-wrap">
          {institutionDisplayName && (
            <>
              <span className="font-medium text-muted-foreground/90 truncate max-w-[130px] sm:max-w-[180px]">
                {institutionDisplayName}
              </span>
              <span className="text-muted-foreground/40">·</span>
            </>
          )}
          <span className="whitespace-nowrap shrink-0">{formatTimeAgo(post.createdAt)}</span>
          {post.isEdited && (
            <span
              className="text-muted-foreground/60 text-[10px] italic shrink-0"
              title={`Edited ${post.updatedAt ? formatTimeAgo(post.updatedAt) : ""}`}
            >
              (edited)
            </span>
          )}
          {post.type === "CONFESSION" && (
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              Confession
            </span>
          )}
          {post.type === "MEME" && (
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              Meme
            </span>
          )}
        </div>
      </div>

      {/* Right Actions: Context menu pushed to far top-right using ml-auto */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto self-start pt-0.5">
        {post.externalPost && <RedditAttribution externalPost={post.externalPost} variant="subtle" />}

        {/* Circular More Options Button */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="cl-interactive size-8 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
            aria-label="More options"
          >
            <MoreHorizontal className="size-4" />
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
                  className="absolute right-0 mt-1.5 w-48 rounded-2xl border border-border/50 bg-popover text-popover-foreground shadow-2xl z-30 py-1.5 animate-in fade-in zoom-in-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenRepostModal();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <AnimatedIcon
                      icon={AnimateRepeat2}
                      animation="nudge-right"
                      size={16}
                      className="text-emerald-500"
                    />
                    <span>Repost or Quote</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onShare();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Link2 className="size-4 text-blue-500" />
                    <span>Copy Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setShowMenu(false);
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        try {
                          await navigator.clipboard.writeText(post.body || "");
                          toast.success("Post text copied to clipboard!");
                        } catch {
                          toast.error("Failed to copy text");
                        }
                      }
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Copy className="size-4 text-purple-500" />
                    <span>Copy Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenReportModal();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Flag className="size-4" />
                    <span>Report Post</span>
                  </button>

                  {currentUserId && post.authorId === currentUserId && (
                    <>
                      <Link
                        href={`/post/${post.id}/edit`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2 border-t border-border/30 mt-1"
                      >
                        <Edit3 className="size-4 text-primary" />
                        <span>Edit Post</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleToggleArchive}
                        disabled={isArchiving}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Archive className="size-4 text-amber-500" />
                        <span>{post.status === "ARCHIVED" ? "Restore to Feed" : "Archive Post"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <AnimatedIcon icon={AnimateTrash2} animation="shake" size={16} />
                        <span>Delete Post</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Optional Context Sub-Row: Community & College */}
      {post.community && (
        <div className="pt-0.5 text-[11px] font-medium text-muted-foreground/80 truncate">
          <Link
            href={`/communities/${post.community.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex max-w-full items-center gap-1 font-bold text-primary hover:underline truncate"
            title={`c/${post.community.name}`}
          >
            <span>c/{post.community.name}</span>
          </Link>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await deletePost(post.id);
            toast.success("Post deleted");
            router.refresh();
          } catch {
            toast.error("Failed to delete post");
          } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
          }
        }}
        title="Delete post?"
        description="This can't be undone and it will be removed from your profile, the timeline of any accounts that follow you, and from search results."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
