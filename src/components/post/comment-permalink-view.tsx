"use client";

import {
  Building2,
  Check,
  Coins,
  Copy,
  Link2,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Send,
  User,
  VenetianMask,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  detectMentionTrigger,
  MentionSuggestions,
  type TriggerContext,
} from "@/components/ui/mention-autocomplete";
import { RichText } from "@/components/ui/rich-text";
import { useProfile } from "@/hooks/use-profile";
import { voteComment } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl, initialOf } from "@/lib/utils";

export interface CommentAuthor {
  id?: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  points?: number | null;
  institution?: {
    id?: string;
    name?: string | null;
    slug?: string | null;
  } | null;
}

export interface CommentData {
  id: string;
  postId: string;
  parentId?: string | null;
  body: string;
  isAnonymous: boolean;
  pseudonym?: string | null;
  isPinned?: boolean;
  likesCount?: number;
  repliesCount?: number;
  hasLiked?: boolean;
  imageUrl?: string | null;
  replyToUserId?: string | null;
  createdAt: Date | string;
  authorId?: string | null;
  author?: CommentAuthor | null;
}

interface CommentPermalinkViewProps {
  comment: CommentData;
  replies: CommentData[];
  postAuthorId?: string | null;
  postCollegeName?: string | null;
}

export function CommentPermalinkView({
  comment,
  replies: initialReplies,
  postAuthorId,
  postCollegeName,
}: CommentPermalinkViewProps) {
  const { profile } = useProfile();
  const [replies, setReplies] = useState<CommentData[]>(initialReplies);
  const [liked, setLiked] = useState(Boolean(comment.hasLiked));
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);

  useEffect(() => {
    setLiked(Boolean(comment.hasLiked));
    setLikesCount(comment.likesCount || 0);
  }, [comment.hasLiked, comment.likesCount]);

  // Reply Composer State
  const [replyBody, setReplyBody] = useState("");
  const [replyIsAnon, setReplyIsAnon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionTrigger, setMentionTrigger] = useState<TriggerContext | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const likeHandle = useIconHandle();
  const replyHandle = useIconHandle();

  const isAnon = comment.isAnonymous;
  const authorName = isAnon ? "Anonymous Student" : comment.author?.displayName || "Student";
  const handle = isAnon ? comment.pseudonym || "anonymous" : comment.author?.username || "student";
  const avatarUrl = isAnon
    ? ""
    : getAvatarUrl(
        comment.author?.avatarUrl,
        comment.author?.username ?? "student",
        comment.author?.displayName
      );
  const fallback = isAnon ? (
    <VenetianMask className="size-5 text-brand-text" />
  ) : (
    initialOf(comment.author?.displayName, "S")
  );

  const isVerified = Boolean(!isAnon && (comment.author?.points || 0) >= 150);
  const isPostAuthor = Boolean(postAuthorId && comment.authorId === postAuthorId);
  const collegeName = comment.author?.institution?.name?.split(",")[0] || postCollegeName || null;
  const loopPoints = comment.author?.points ?? 0;

  async function handleCopyLink(targetCommentId: string = comment.id) {
    const url = `https://campusloop.space/post/${comment.postId}/comment/${targetCommentId}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied");
      } catch {
        toast.error("Couldn't copy the link.");
      }
    } else {
      toast.error("Copying isn't supported in this browser.");
    }
  }

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

    try {
      const res = await voteComment(comment.postId, comment.id);
      if (res && typeof res.likesCount === "number") {
        setLikesCount(res.likesCount);
        setLiked(res.hasLiked);
      }
    } catch {
      setLiked(liked);
      setLikesCount(likesCount);
      toast.error("Couldn't react. Try again.");
    }
  }

  function handleReplyTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setReplyBody(val);
    const cursor = e.target.selectionStart ?? val.length;
    setMentionTrigger(detectMentionTrigger(val, cursor));
  }

  function handleSelectSuggestion(replacement: string, trigger: TriggerContext) {
    const before = replyBody.slice(0, trigger.startIndex);
    const after = replyBody.slice(trigger.endIndex);
    const newText = `${before}${replacement}${after}`;
    setReplyBody(newText);
    setMentionTrigger(null);
    setTimeout(() => {
      if (replyTextareaRef.current) {
        replyTextareaRef.current.focus();
        const newPos = before.length + replacement.length;
        replyTextareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    const body = replyBody.trim();
    if (!body || isSubmitting) return;

    sounds.send();
    haptics.medium();

    const optimisticReply: CommentData = {
      id: `temp_${Date.now()}`,
      postId: comment.postId,
      parentId: comment.id,
      body,
      isAnonymous: replyIsAnon,
      pseudonym: replyIsAnon ? profile?.anonymousUsername || "Anonymous Student" : null,
      createdAt: new Date(),
      authorId: profile?.id || null,
      author: replyIsAnon
        ? null
        : {
            id: profile?.id,
            username: profile?.username,
            displayName: profile?.displayName,
            avatarUrl: profile?.avatarUrl,
            points: profile?.points,
            institution: profile?.institution ? { name: profile.institution.name } : null,
          },
    };

    const previousReplies = replies;
    setReplies((prev) => [...prev, optimisticReply]);
    setReplyBody("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${comment.postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          isAnonymous: replyIsAnon,
          parentId: comment.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to post reply");
      toast.success("Reply posted");
    } catch (err) {
      setReplies(previousReplies);
      toast.error(err instanceof Error ? err.message : "Couldn't post your reply. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Highlighted Comment Anchor Card */}
      <article className="rounded-lg border border-border-strong bg-surface p-5 sm:p-6 relative overflow-hidden">
        {/* Highlighted Top Banner */}
        <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-border">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-muted text-fg-muted">
            <MessageSquare className="size-3.5" aria-hidden />
            <span>Comment</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Link Action */}
            <button
              type="button"
              onClick={() => handleCopyLink(comment.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer border border-border"
              title="Copy link to comment"
            >
              {copied ? <Check className="size-3 text-success" /> : <Link2 className="size-3" />}
              <span>{copied ? "Copied" : "Copy link"}</span>
            </button>

            {/* More Menu */}
            <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
              <DropdownMenuTrigger
                className="size-10 rounded-full hover:bg-surface-muted text-fg-subtle hover:text-fg flex items-center justify-center transition-ui cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Comment options"
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCopyLink(comment.id)}>
                  <Link2 aria-hidden />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      try {
                        await navigator.clipboard.writeText(comment.body || "");
                        toast.success("Text copied");
                      } catch {
                        toast.error("Couldn't copy the text.");
                      }
                    }
                  }}
                >
                  <Copy aria-hidden />
                  Copy text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Author Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {!isAnon ? (
              <Link href={`/@${handle}`} className="shrink-0">
                <Avatar className="size-11 rounded-full border border-border hover:opacity-90 transition-opacity">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-sm font-bold bg-muted">{fallback}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar className="size-11 rounded-full border border-border bg-muted shrink-0">
                <AvatarFallback className="text-sm font-bold">{fallback}</AvatarFallback>
              </Avatar>
            )}

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap text-sm leading-none">
                {!isAnon ? (
                  <Link href={`/@${handle}`} className="font-bold text-foreground hover:underline truncate">
                    {authorName}
                  </Link>
                ) : (
                  <span className="font-bold text-foreground truncate">{authorName}</span>
                )}

                {isVerified && (
                  <AnimatedIcon
                    icon={AnimateShieldCheck}
                    animation="pop"
                    size={15}
                    className="text-brand shrink-0"
                  />
                )}

                {isPostAuthor && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary border border-primary/20">
                    Author
                  </span>
                )}

                <span className="text-xs text-muted-foreground truncate">@{handle}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground/70 shrink-0">
                  {formatTimeAgo(comment.createdAt)}
                </span>
              </div>

              {/* Badges: College and Loop Points */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                {collegeName && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border">
                    <Building2 className="size-3 text-muted-foreground" />
                    <span>{collegeName}</span>
                  </span>
                )}

                {!isAnon && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-reward-text bg-reward-subtle px-2 py-0.5 rounded-full tabular-nums">
                    <Coins className="size-3" aria-hidden />
                    <span>{loopPoints} points</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comment Body */}
        <div className="py-4 text-base sm:text-lg leading-relaxed text-foreground break-words font-normal">
          <RichText content={comment.body} />
        </div>

        {/* Actions: Vote & Reply */}
        <div className="flex items-center gap-4 pt-2 border-t border-border select-none">
          <button
            type="button"
            onClick={handleToggleLike}
            {...likeHandle.handlers}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer",
              liked
                ? "border-danger/30 bg-danger/10 text-danger"
                : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <AnimatedIcon
              ref={likeHandle.ref}
              icon={AnimateHeart}
              animation="beat"
              size={16}
              animateOnHover={false}
              playKey={liked}
              iconClassName={cn(liked ? "fill-danger text-danger" : "")}
            />
            <span>{likesCount > 0 ? likesCount : "Upvote"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              replyTextareaRef.current?.focus();
            }}
            {...replyHandle.handlers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors cursor-pointer"
          >
            <AnimatedIcon
              ref={replyHandle.ref}
              icon={AnimateMessageCircle}
              animation="pop"
              size={15}
              animateOnHover={false}
            />
            <span>Reply</span>
          </button>
        </div>

        {/* Embedded Reply Composer */}
        <div className="mt-5 pt-4 border-t border-border">
          <form onSubmit={handleSubmitReply} className="space-y-2.5">
            <div className="relative">
              <MentionSuggestions
                trigger={mentionTrigger}
                onSelect={handleSelectSuggestion}
                onClose={() => setMentionTrigger(null)}
                className="bottom-full mb-2 left-0"
              />

              <div className="rounded-2xl border border-border bg-muted/30 p-3 space-y-2.5 focus-within:border-primary/50 transition-colors">
                <textarea
                  ref={replyTextareaRef}
                  value={replyBody}
                  onChange={handleReplyTextChange}
                  placeholder={`Reply to @${handle}…`}
                  rows={2}
                  className="w-full bg-transparent text-base sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setReplyIsAnon(!replyIsAnon)}
                    className={cn(
                      "text-xs font-bold px-2.5 py-1 rounded-full transition-colors cursor-pointer inline-flex items-center gap-1.5",
                      replyIsAnon
                        ? "bg-brand/15 text-brand-text border border-brand-subtle-border/30"
                        : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {replyIsAnon ? (
                      <>
                        <VenetianMask className="size-3 text-brand-text" />
                        <span>Anonymous</span>
                      </>
                    ) : (
                      <>
                        <User className="size-3" />
                        <span>Public</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !replyBody.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-bold disabled:opacity-40 hover:opacity-90 transition-transform cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Send className="size-3.5" />
                    <span>{isSubmitting ? "Posting..." : "Reply"}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </article>

      {/* Direct Replies Section */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground inline-flex items-center gap-2">
            <MessageCircle className="size-4 text-primary" />
            <span>Direct Replies ({replies.length})</span>
          </h3>
        </div>

        {replies.length > 0 ? (
          <div className="space-y-3">
            {replies.map((reply) => {
              const replyAnon = reply.isAnonymous;
              const replyAuthorName = replyAnon
                ? "Anonymous Student"
                : reply.author?.displayName || "Student";
              const replyHandle = replyAnon
                ? reply.pseudonym || "anonymous"
                : reply.author?.username || "student";
              const replyAvatarUrl = replyAnon
                ? ""
                : getAvatarUrl(
                    reply.author?.avatarUrl,
                    reply.author?.username ?? "student",
                    reply.author?.displayName
                  );
              const replyFallback = replyAnon ? (
                <VenetianMask className="size-4 text-brand-text" />
              ) : (
                initialOf(reply.author?.displayName, "S")
              );

              return (
                <div
                  key={reply.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-2 hover:border-border transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!replyAnon ? (
                        <Link href={`/@${replyHandle}`}>
                          <Avatar className="size-7 rounded-full border border-border">
                            <AvatarImage src={replyAvatarUrl} />
                            <AvatarFallback className="text-xs font-bold bg-muted">
                              {replyFallback}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      ) : (
                        <Avatar className="size-7 rounded-full border border-border bg-muted">
                          <AvatarFallback className="text-xs font-bold">{replyFallback}</AvatarFallback>
                        </Avatar>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap text-xs leading-none">
                        {!replyAnon ? (
                          <Link
                            href={`/@${replyHandle}`}
                            className="font-bold text-foreground hover:underline truncate"
                          >
                            {replyAuthorName}
                          </Link>
                        ) : (
                          <span className="font-bold text-foreground truncate">{replyAuthorName}</span>
                        )}
                        <span className="text-muted-foreground/70 text-xs">@{replyHandle}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-muted-foreground/70 text-xs shrink-0">
                          {formatTimeAgo(reply.createdAt)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(reply.id)}
                      className="size-9 rounded-full hover:bg-muted text-muted-foreground/50 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Copy link to reply"
                    >
                      <Link2 className="size-3" />
                    </button>
                  </div>

                  <div className="text-xs sm:text-sm text-foreground/90 pl-9 leading-relaxed break-words font-normal">
                    <RichText content={reply.body} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground space-y-1">
            <p className="text-xs font-semibold">No replies yet.</p>
            <p className="text-xs text-muted-foreground/70">
              Be the first to join the conversation and reply above!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
