"use client";

import { LogIn, MessageSquare, Send, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/use-profile";
import { fetcher, voteArticleComment } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { type ArticleComment, ArticleCommentItem } from "./article-comment-item";

interface ArticleCommentsSectionProps {
  articleSlug: string;
  currentProfile?: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export function ArticleCommentsSection({
  articleSlug,
  currentProfile: propProfile,
}: ArticleCommentsSectionProps) {
  const { profile: hookProfile } = useProfile();
  const effectiveProfile = propProfile || hookProfile;

  const [commentText, setCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const encodedSlug = encodeURIComponent(articleSlug);

  const { data, isLoading, mutate } = useSWR<{
    comments: ArticleComment[];
    totalCount: number;
  }>(`/api/articles/${encodedSlug}/comments`, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 1000,
  });

  const comments = data?.comments || [];
  const totalCount = data?.totalCount || 0;

  async function handleAddComment(parentId: string | null = null) {
    const textToSend = parentId ? replyText.trim() : commentText.trim();
    if (!textToSend) return;

    if (!effectiveProfile) {
      toast.info("Sign in to comment.");
      return;
    }

    setIsSubmitting(true);
    sounds.send();
    haptics.medium();

    try {
      const res = await fetch(`/api/articles/${encodedSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: textToSend,
          parentId,
        }),
      });

      if (!res.ok) {
        const errPayload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errPayload.error || "Couldn't post your comment. Try again.");
      }

      toast.success(parentId ? "Reply posted" : "Comment posted");
      if (parentId) {
        setReplyingToId(null);
        setReplyText("");
      } else {
        setCommentText("");
      }
      mutate(undefined, { revalidate: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't post your comment. Try again.";
      toast.error(msg);
      haptics.error();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVoteComment(commentId: string) {
    if (!effectiveProfile) {
      toast.info("Sign in to upvote comments.");
      return;
    }

    sounds.pop();
    haptics.light();

    const previousData = data;

    // Helper to update vote and count optimistically in the nested tree
    const updateInTree = (list: ArticleComment[]): ArticleComment[] => {
      return list.map((item) => {
        if (item.id === commentId) {
          const isCurrentlyVoted = (item.userVote || 0) > 0;
          return {
            ...item,
            userVote: isCurrentlyVoted ? 0 : 1,
            upvotesCount: Math.max(0, (item.upvotesCount || 0) + (isCurrentlyVoted ? -1 : 1)),
          };
        }
        if (item.replies && item.replies.length > 0) {
          return {
            ...item,
            replies: updateInTree(item.replies),
          };
        }
        return item;
      });
    };

    // 1. Instant Optimistic State Update
    await mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          comments: updateInTree(current.comments),
        };
      },
      { revalidate: false }
    );

    try {
      const res = await voteArticleComment(articleSlug, commentId);

      // 2. Authoritative Sync from Server Response
      await mutate(
        (current) => {
          if (!current) return current;
          const syncInTree = (list: ArticleComment[]): ArticleComment[] => {
            return list.map((item) => {
              if (item.id === commentId) {
                return {
                  ...item,
                  userVote: res.userVote,
                  upvotesCount: res.upvotesCount,
                };
              }
              if (item.replies && item.replies.length > 0) {
                return {
                  ...item,
                  replies: syncInTree(item.replies),
                };
              }
              return item;
            });
          };
          return {
            ...current,
            comments: syncInTree(current.comments),
          };
        },
        { revalidate: false }
      );
    } catch {
      // Rollback to previous state on network failure
      await mutate(previousData, { revalidate: false });
      toast.error("Couldn't save your upvote. Try again.");
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment? This can't be undone.")) return;

    try {
      const res = await fetch(`/api/articles/${encodedSlug}/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Comment deleted");
      mutate();
    } catch {
      toast.error("Couldn't delete the comment. Try again.");
    }
  }

  function startReply(id: string) {
    if (!effectiveProfile) {
      toast.info("Sign in to reply.");
      return;
    }
    setReplyingToId((prev) => (prev === id ? null : id));
    setReplyText("");
  }

  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="scroll-mt-20 space-y-6 border-t border-border pt-10"
    >
      <h2 id="comments-title" className="flex items-center gap-2 text-2xl text-fg">
        Comments
        <span className="text-base font-normal text-fg-muted tabular-nums">{totalCount}</span>
      </h2>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={effectiveProfile?.avatarUrl || ""} alt="" />
            <AvatarFallback className="bg-surface-muted text-xs font-semibold text-fg">
              {effectiveProfile?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <label htmlFor="article-comment" className="sr-only">
            Your comment
          </label>
          <Textarea
            id="article-comment"
            rows={3}
            placeholder={
              effectiveProfile ? "Add a comment or ask the writer something" : "Sign in to comment"
            }
            disabled={!effectiveProfile || isSubmitting}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-20 flex-1"
          />
        </div>
        <div className="mt-3 flex justify-end">
          {effectiveProfile ? (
            <Button
              size="sm"
              disabled={!commentText.trim()}
              loading={isSubmitting}
              onClick={() => handleAddComment(null)}
            >
              <Send className="size-4" />
              Comment
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href="/sign-in">
                <LogIn className="size-4" />
                Sign in to comment
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading comments">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          size="compact"
          title="No comments yet"
          description="Ask a question or share what you think."
        />
      ) : (
        <ul className="divide-y divide-border">
          {comments.map((root) => (
            <li key={root.id} className="space-y-3 py-4">
              <ArticleCommentItem
                comment={root}
                isMine={effectiveProfile?.id === root.authorId}
                onVote={() => handleVoteComment(root.id)}
                onReply={() => startReply(root.id)}
                onDelete={() => handleDeleteComment(root.id)}
              />

              {replyingToId === root.id && (
                <div className="ml-10 space-y-2 rounded-md border border-brand-subtle-border bg-brand-subtle p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-brand-text">
                    <label htmlFor={`reply-${root.id}`}>Replying to @{root.author?.username}</label>
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      aria-label="Cancel reply"
                      className="-my-2 -mr-2 flex size-11 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <Textarea
                    id={`reply-${root.id}`}
                    rows={2}
                    placeholder="Write a reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="bg-surface"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={!replyText.trim()}
                      loading={isSubmitting}
                      onClick={() => handleAddComment(root.id)}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              )}

              {root.replies && root.replies.length > 0 && (
                <ul className="ml-10 space-y-3 border-l border-border pl-3">
                  {root.replies.map((reply) => (
                    <li key={reply.id}>
                      <ArticleCommentItem
                        comment={reply}
                        isReply
                        isMine={effectiveProfile?.id === reply.authorId}
                        onVote={() => handleVoteComment(reply.id)}
                        onDelete={() => handleDeleteComment(reply.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
