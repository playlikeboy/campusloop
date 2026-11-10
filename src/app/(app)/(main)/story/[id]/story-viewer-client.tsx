"use client";

import { Bookmark, ChevronLeft, ChevronRight, Heart, Loader2, Send, Share2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { decodeStoryText, splitStoryClasses } from "@/components/stories/story-format";
import { StoryHighlightDialog } from "@/components/stories/story-highlight-dialog";
import { StoryStickerStack } from "@/components/stories/story-stickers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StoryProgress } from "@/components/ui/stickers";
import { haptics } from "@/lib/haptics";
import { SITE_URL } from "@/lib/seo";
import { sounds } from "@/lib/sounds";
import { cn, initialOf } from "@/lib/utils";

interface StoryViewerClientProps {
  story: {
    id: string;
    mediaUrl: string | null;
    text: string | null;
    backgroundColor: string | null;
    createdAt: string;
    expiresAt: string;
    author: {
      id: string;
      displayName: string;
      username: string;
      avatarUrl: string | null;
      institution?: { name: string } | null;
    };
  };
  currentUserId: string;
  prevStoryId?: string | null;
  nextStoryId?: string | null;
  initialLiked?: boolean;
  initialLikesCount?: number;
}

const STORY_MS = 7000;

const glassless =
  "flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white transition-ui hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  return `${Math.round(mins / 60)}h`;
}

export function StoryViewerClient({
  story,
  prevStoryId,
  nextStoryId,
  currentUserId,
  initialLiked = false,
  initialLikesCount = 0,
}: StoryViewerClientProps) {
  const router = useRouter();
  const isOwner = story.author.id === currentUserId;

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [showHeart, setShowHeart] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);
  const [posted, setPosted] = useState("");

  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const mouseDownAt = useRef(0);
  const lastTouchAt = useRef(0);
  // A hold (to pause) or a swipe should not also count as a tap on a tap zone.
  const suppressTap = useRef(false);

  const { background, text: textClasses } = splitStoryClasses(story.backgroundColor);
  const { stickers, body } = decodeStoryText(story.text);
  const paused = isHeld || replyText.trim().length > 0 || showHighlightDialog;

  useEffect(() => setPosted(timeAgo(story.createdAt)), [story.createdAt]);

  const go = useCallback(
    (id: string | null | undefined) => {
      haptics.light();
      if (id) {
        sounds.pop();
        router.push(`/story/${id}`);
      } else {
        sounds.tap();
        router.push("/feeds");
      }
    },
    [router]
  );
  const navigatePrev = useCallback(() => go(prevStoryId), [go, prevStoryId]);
  const navigateNext = useCallback(() => go(nextStoryId), [go, nextStoryId]);
  const closeViewer = useCallback(() => go(null), [go]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (replyText.length > 0 || showHighlightDialog) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, [contenteditable='true']")) return;
      if (e.key === "ArrowLeft") navigatePrev();
      else if (e.key === "ArrowRight") navigateNext();
      else if (e.key === "Escape") closeViewer();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigatePrev, navigateNext, closeViewer, replyText, showHighlightDialog]);

  function handleTouchStart(e: React.TouchEvent) {
    setIsHeld(true);
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    setIsHeld(false);
    const start = touchStart.current;
    touchStart.current = null;
    lastTouchAt.current = Date.now();
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;

    suppressTap.current = !(Date.now() - start.t < 250 && Math.abs(dx) < 15 && Math.abs(dy) < 15);
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) return closeViewer();
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? navigateNext() : navigatePrev();
  }

  function handleTapZone(direction: "prev" | "next") {
    if (suppressTap.current) {
      suppressTap.current = false;
      return;
    }
    if (direction === "prev") navigatePrev();
    else navigateNext();
  }

  async function handleLike() {
    const nextLiked = !liked;
    const prevCount = likesCount;
    setLiked(nextLiked);
    setLikesCount(nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1));

    if (nextLiked) {
      sounds.pop();
      haptics.heartbeat();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
    } else {
      haptics.light();
    }

    try {
      const res = await fetch(`/api/stories/${story.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { liked?: boolean; likesCount: number };
      if (typeof data.liked === "boolean") {
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch {
      setLiked(!nextLiked);
      setLikesCount(prevCount);
      toast.error("Couldn't save your like. Check your connection.");
    }
  }

  async function handleShare() {
    sounds.tap();
    haptics.light();
    const url = `${SITE_URL}/story/${story.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${story.author.displayName}'s story`, url });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || isReplying) return;

    sounds.send();
    haptics.success();
    setIsReplying(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: story.author.id,
          content: `Replied to your story: "${replyText.trim()}"`,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Sent to @${story.author.username}`);
      setReplyText("");
    } catch {
      toast.error("Couldn't send your reply. Try again, or message them from Chat.");
    } finally {
      setIsReplying(false);
    }
  }

  return (
    <div className="dark fixed inset-0 z-50 flex h-dvh touch-manipulation select-none items-center justify-center bg-black md:p-4">
      <button
        type="button"
        onClick={navigatePrev}
        className={cn(glassless, "mr-4 hidden md:flex")}
        aria-label={prevStoryId ? "Previous story" : "Back to feed"}
      >
        <ChevronLeft className="size-6" aria-hidden />
      </button>

      <article
        aria-label={`Story by ${story.author.displayName}`}
        className={cn(
          "relative flex h-full w-full flex-col justify-between overflow-hidden text-white md:h-[min(92dvh,844px)] md:w-[min(430px,100vw)] md:rounded-xl",
          story.mediaUrl ? "bg-black" : background
        )}
        onMouseDown={() => {
          // Phones fire mouse events after touch ones; the touch handlers already ran.
          if (Date.now() - lastTouchAt.current < 1000) return;
          mouseDownAt.current = Date.now();
          setIsHeld(true);
        }}
        onMouseUp={() => {
          if (Date.now() - lastTouchAt.current < 1000) return;
          if (mouseDownAt.current) suppressTap.current = Date.now() - mouseDownAt.current >= 250;
          setIsHeld(false);
        }}
        onMouseLeave={() => setIsHeld(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleLike}
      >
        {story.mediaUrl && (
          <img
            src={story.mediaUrl}
            alt={body ? `Story photo: ${body.slice(0, 80)}` : `Story photo from ${story.author.displayName}`}
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />
        )}

        {/* Tap zones: left third goes back, the rest goes forward. Content and controls sit above. */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => handleTapZone("prev")}
          className="absolute inset-y-0 left-0 z-10 w-[35%] cursor-pointer focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => handleTapZone("next")}
          className="absolute inset-y-0 right-0 z-10 w-[65%] cursor-pointer focus:outline-none"
        />

        {showHeart && (
          <div
            className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
            aria-hidden
          >
            <Heart className="sticker-pop size-28 fill-danger text-danger" />
          </div>
        )}

        {/* Progress + author */}
        <header className={cn(
            "relative z-20 flex w-full flex-col gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]",
            story.mediaUrl && "bg-black/40"
          )}>
          <StoryProgress
            key={story.id}
            count={1}
            current={0}
            duration={STORY_MS}
            paused={paused}
            onComplete={navigateNext}
            tone="onField"
          />

          <div className="flex w-full items-center justify-between gap-2">
            <Link
              href={`/@${story.author.username}`}
              className="flex min-w-0 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Avatar className="size-9">
                <AvatarImage src={story.author.avatarUrl || ""} alt="" />
                <AvatarFallback className="bg-sticker text-sm font-semibold text-sticker-fg">
                  {initialOf(story.author.displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold">
                  {story.author.displayName}
                  {posted && <span className="font-normal text-white/80"> · {posted}</span>}
                </span>
                {story.author.institution && (
                  <span className="block truncate text-xs text-white/80">
                    {story.author.institution.name.split(",")[0]}
                  </span>
                )}
              </span>
            </Link>

            <button type="button" onClick={closeViewer} className={glassless} aria-label="Close story">
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </header>

        {/* Story content */}
        <div className="pointer-events-none relative z-20 flex flex-1 flex-col items-center justify-center gap-4 px-6 py-4">
          <StoryStickerStack stickers={stickers} linkMentions />
          {body && (
            <p
              className={cn(
                "w-full max-w-[22rem] whitespace-pre-wrap break-words leading-tight",
                textClasses || "sticker-caption text-center text-2xl",
                story.mediaUrl && "rounded-lg bg-black/55 px-4 py-3"
              )}
            >
              {body}
            </p>
          )}
        </div>

        {/* Reply / like / share */}
        <footer className={cn(
            "relative z-20 flex w-full items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            story.mediaUrl && "bg-black/40"
          )}>
          {!isOwner ? (
            <form onSubmit={handleSendReply} className="relative flex flex-1 items-center">
              <label htmlFor="story-reply" className="sr-only">
                Reply to {story.author.displayName}
              </label>
              <input
                id="story-reply"
                type="text"
                placeholder={`Reply to ${story.author.displayName.split(" ")[0]}…`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                maxLength={500}
                className="h-11 w-full rounded-full border border-white/50 bg-black/35 pr-12 pl-4 text-base text-white caret-white transition-ui placeholder:text-white/75 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isReplying}
                aria-label="Send reply"
                className="absolute right-0.5 flex size-10 cursor-pointer items-center justify-center rounded-full bg-sticker text-sticker-fg transition-ui disabled:opacity-0"
              >
                {isReplying ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
              </button>
            </form>
          ) : (
            <div className="flex-1">
              <button
                type="button"
                onClick={() => setShowHighlightDialog(true)}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-black/45 px-4 text-sm font-semibold text-white transition-ui hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Bookmark className="size-4" aria-hidden />
                Add to highlight
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike story" : "Like story"}
            className={cn(glassless, "w-auto min-w-11 gap-1.5 px-3")}
          >
            <Heart className={cn("size-5", liked && "fill-danger text-danger")} aria-hidden />
            {likesCount > 0 && <span className="text-sm font-semibold tabular-nums">{likesCount}</span>}
          </button>

          <button type="button" onClick={handleShare} className={glassless} aria-label="Share story">
            <Share2 className="size-5" aria-hidden />
          </button>
        </footer>
      </article>

      <button
        type="button"
        onClick={navigateNext}
        className={cn(glassless, "ml-4 hidden md:flex")}
        aria-label={nextStoryId ? "Next story" : "Back to feed"}
      >
        <ChevronRight className="size-6" aria-hidden />
      </button>

      {isOwner && (
        <StoryHighlightDialog
          open={showHighlightDialog}
          onOpenChange={setShowHighlightDialog}
          storyId={story.id}
          storyMediaUrl={story.mediaUrl}
        />
      )}
    </div>
  );
}
