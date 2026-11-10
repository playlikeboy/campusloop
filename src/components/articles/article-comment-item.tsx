"use client";

import { CornerDownRight, ThumbsUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initialOf } from "@/lib/utils";

export interface ArticleComment {
  id: string;
  body: string;
  authorId: string;
  createdAt?: string | Date | null;
  upvotesCount?: number | null;
  userVote?: number | null;
  replies?: ArticleComment[];
  author?: {
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
    institution?: { name?: string | null } | null;
  } | null;
}

const actionClass =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-ui";

/** One comment or reply: byline, body and actions. Replies pass `isReply` for the smaller size. */
export function ArticleCommentItem({
  comment,
  isReply = false,
  isMine,
  onVote,
  onReply,
  onDelete,
}: {
  comment: ArticleComment;
  isReply?: boolean;
  isMine: boolean;
  onVote: () => void;
  onReply?: () => void;
  onDelete: () => void;
}) {
  const author = comment.author;
  const handle = author?.username || "";
  const name = author?.displayName || (handle ? `@${handle}` : "Student");
  const college = author?.institution?.name?.split(",")[0];
  const voted = (comment.userVote || 0) > 0;
  const date = comment.createdAt
    ? new Date(comment.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
    : "Just now";

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <Link href={handle ? `/@${handle}` : "#"} className="group flex min-w-0 items-center gap-2">
          <Avatar className={cn("shrink-0", isReply ? "size-6" : "size-8")}>
            <AvatarImage src={author?.avatarUrl || ""} alt="" />
            <AvatarFallback className="bg-surface-muted text-xs font-semibold text-fg">
              {initialOf(name)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-fg group-hover:underline">{name}</span>
            {!isReply && (handle || college) && (
              <span className="block truncate text-xs text-fg-muted">
                {handle && `@${handle}`}
                {college ? ` · ${college}` : ""}
              </span>
            )}
          </span>
        </Link>
        <span className="shrink-0 text-xs text-fg-subtle">{date}</span>
      </div>

      <p className={cn("text-sm whitespace-pre-wrap text-fg", isReply ? "pl-8" : "pl-10")}>{comment.body}</p>

      <div className={cn("flex items-center gap-1 text-fg-muted", isReply ? "pl-6" : "pl-8")}>
        <button
          type="button"
          onClick={onVote}
          aria-label={voted ? "Remove upvote" : "Upvote"}
          aria-pressed={voted}
          className={cn(
            actionClass,
            "tabular-nums",
            voted ? "bg-brand-subtle text-brand-text" : "hover:bg-surface-muted hover:text-fg"
          )}
        >
          <ThumbsUp className={cn("size-4", voted && "fill-current")} />
          {comment.upvotesCount || 0}
        </button>
        {onReply && (
          <button
            type="button"
            onClick={onReply}
            className={cn(actionClass, "hover:bg-surface-muted hover:text-fg")}
          >
            <CornerDownRight className="size-4" />
            Reply
          </button>
        )}
        {isMine && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete comment"
            className={cn(actionClass, "ml-auto hover:bg-danger-subtle hover:text-danger")}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
