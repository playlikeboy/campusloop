"use client";

import {
  Archive,
  Bot,
  Copy,
  Edit3,
  ExternalLink,
  Flag,
  Link2,
  MoreHorizontal,
  VenetianMask,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { archivePost, deletePost } from "@/app/(app)/(main)/post/actions";
import { RedditAttribution } from "@/components/reddit/reddit-attribution";
import { AnimatedIcon, AnimateRepeat2, AnimateTrash2 } from "@/components/ui/animated-icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { FeedPost } from "@/hooks/use-feed";
import { isCollegeVerifiedUser } from "@/lib/user-verification";
import { cn, formatTimeAgo, getCollegeShortName } from "@/lib/utils";

function isoDate(value: Date | string): string | undefined {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

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
  const { mutate } = useSWRConfig();
  const [isUndoingRepost, setIsUndoingRepost] = useState(false);
  const isOwnRepost = Boolean(currentUserId && post.authorId === currentUserId && post.repostOfId);
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

  async function handleUndoRepost() {
    if (!isOwnRepost || isUndoingRepost) return;
    setIsUndoingRepost(true);

    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}/repost`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result?.error || "Could not undo repost");
      }

      toast.success("Repost removed");
      await mutate((key) => typeof key === "string" && key.includes("/api/feed"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not undo repost");
    } finally {
      setIsUndoingRepost(false);
    }
  }

  async function handleToggleArchive() {
    setIsArchiving(true);
    try {
      const res = await archivePost(post.id);
      toast.success(res.isArchived ? "Hidden from the feed. Only you can see it." : "Back on the feed");
      router.refresh();
    } catch {
      toast.error("Couldn't update this post. Try again.");
    } finally {
      setIsArchiving(false);
    }
  }

  const isExternalReddit = Boolean(post.externalPost && post.externalPost.source === "reddit");
  const isBotPost = Boolean(
    post.pseudonym && (post.pseudonym.startsWith("\u{1F916}") || post.pseudonym.toLowerCase().includes("bot"))
  );
  const cleanBotPseudonym = post.pseudonym?.replace(/^[\u{1F916}\s]+/u, "").trim();

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
    !isBotPost && !post.isAnonymous && (post.author?.isCollegeVerified || isCollegeVerifiedUser(post.author))
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
                className="font-semibold text-[15px] text-fg hover:underline truncate max-w-[160px] sm:max-w-[220px] shrink-0"
              >
                {authorName}
              </Link>
            ) : !post.isAnonymous && isExternalReddit ? (
              <a
                href={post.externalPost?.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-[15px] text-fg hover:underline truncate max-w-[160px] sm:max-w-[220px] shrink-0"
              >
                {authorName}
              </a>
            ) : (
              <span className="font-semibold text-[15px] text-fg truncate max-w-[160px] sm:max-w-[220px] shrink-0">
                {authorName}
              </span>
            )}

            {isVerified && <VerifiedBadge size="sm" />}

            {!isBotPost &&
              !post.isAnonymous &&
              post.authorId &&
              currentUserId &&
              currentUserId !== post.authorId &&
              post.author?.username && (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  className={cn(
                    "relative h-6 px-2.5 rounded-full text-xs font-semibold transition-ui cursor-pointer shrink-0 active:scale-95 after:absolute after:-inset-2.5 after:content-['']",
                    isFollowing
                      ? "bg-surface-muted text-fg-muted hover:bg-surface-sunken"
                      : "bg-brand-subtle text-brand-text hover:bg-brand hover:text-brand-fg"
                  )}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}

            {isBotPost && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-fg-muted text-xs font-medium shrink-0">
                <Bot className="size-3" aria-hidden />
                <span>Bot</span>
              </span>
            )}

            {post.isAnonymous && !isBotPost && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-fg-muted text-xs font-medium shrink-0">
                <VenetianMask className="size-3" aria-hidden />
                <span>Anonymous</span>
              </span>
            )}

            {authorHandle && (
              <span className="text-fg-subtle text-xs truncate max-w-[90px] sm:max-w-[130px] shrink-0">
                {authorHandle}
              </span>
            )}

            {isExternalReddit && (
              <a
                href={post.externalPost?.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted hover:bg-surface-sunken text-fg-muted text-xs font-medium shrink-0 transition-ui"
                title={`From r/${post.externalPost?.subreddit || "reddit"}`}
              >
                <span>r/{post.externalPost?.subreddit}</span>
                <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
          </div>

          {/* Subtitle: College Tag · Timestamp · Tags */}
          <div className="flex items-center gap-1.5 text-xs text-fg-subtle min-w-0 pt-0.5 flex-wrap">
            {institutionDisplayName && (
              <>
                <span className="font-medium text-fg-muted truncate max-w-[130px] sm:max-w-[180px]">
                  {institutionDisplayName}
                </span>
                <span aria-hidden>·</span>
              </>
            )}
            <time className="whitespace-nowrap shrink-0 tabular-nums" dateTime={isoDate(post.createdAt)}>
              {formatTimeAgo(post.createdAt)}
            </time>
            {post.isEdited && (
              <span
                className="text-fg-subtle text-xs shrink-0"
                title={`Edited ${post.updatedAt ? formatTimeAgo(post.updatedAt) : ""}`}
              >
                (edited)
              </span>
            )}
            {post.type === "CONFESSION" && (
              <span className="text-xs font-medium px-2 rounded-full bg-surface-muted text-fg-muted shrink-0">
                Confession
              </span>
            )}
            {post.type === "MEME" && (
              <span className="text-xs font-medium px-2 rounded-full bg-surface-muted text-fg-muted shrink-0">
                Meme
              </span>
            )}
          </div>
        </div>

        {/* Right Actions: Context menu pushed to far top-right using ml-auto */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto self-start pt-0.5">
          {post.externalPost && <RedditAttribution externalPost={post.externalPost} variant="subtle" />}

          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="cl-interactive flex size-11 -m-1.5 items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              aria-label="Post options"
            >
              <MoreHorizontal className="size-5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {isOwnRepost ? (
                <DropdownMenuItem
                  variant="danger"
                  disabled={isUndoingRepost}
                  onClick={() => void handleUndoRepost()}
                >
                  <AnimatedIcon icon={AnimateRepeat2} animation="nudge-right" size={16} />
                  {isUndoingRepost ? "Undoing repost…" : "Undo repost"}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onOpenRepostModal}>
                  <AnimatedIcon icon={AnimateRepeat2} animation="nudge-right" size={16} />
                  Repost or quote
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onShare}>
                <Link2 aria-hidden />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  if (typeof navigator === "undefined" || !navigator.clipboard) return;
                  try {
                    await navigator.clipboard.writeText(post.body || "");
                    toast.success("Text copied");
                  } catch {
                    toast.error("Couldn't copy. Select the text and copy it yourself.");
                  }
                }}
              >
                <Copy aria-hidden />
                Copy text
              </DropdownMenuItem>
              {currentUserId && post.authorId === currentUserId && !post.repostOfId ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/post/${post.id}/edit`)}>
                    <Edit3 aria-hidden />
                    Edit post
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={isArchiving} onClick={handleToggleArchive}>
                    <Archive aria-hidden />
                    {post.status === "ARCHIVED" ? "Show on feed again" : "Hide from feed"}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                    <AnimatedIcon icon={AnimateTrash2} animation="shake" size={16} />
                    Delete post
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="danger" onClick={onOpenReportModal}>
                    <Flag aria-hidden />
                    Report post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Optional Context Sub-Row: Community & College */}
      {post.community && (
        <div className="pt-0.5 text-xs font-medium text-fg-muted truncate">
          <Link
            href={`/communities/${post.community.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex max-w-full items-center gap-1 font-semibold text-brand-text hover:underline truncate"
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
            toast.error("Couldn't delete the post. Try again.");
          } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
          }
        }}
        title="Delete post?"
        description="It will be removed from your profile and everyone's feed. You can't undo this."
        confirmText={isDeleting ? "Deleting…" : "Delete"}
        variant="danger"
      />
    </div>
  );
}
