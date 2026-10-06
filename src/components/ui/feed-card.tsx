"use client";

import { ArrowRight, Bot, Flame, Globe, Heart, Megaphone, Repeat2, School, ShieldAlert, VenetianMask } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FastCommentsModal } from "@/components/feed/fast-comments-modal";
import { FeedCardActions } from "@/components/feed/feed-card-actions";
import { FeedCardHeader } from "@/components/feed/feed-card-header";
import { FeedCardRepostModal } from "@/components/feed/feed-card-repost-modal";
import { FeedSocialContextBar } from "@/components/feed/feed-social-context";
import { PostLikesModal } from "@/components/post/post-likes-modal";
import { RedditGallery } from "@/components/reddit/reddit-gallery";
import { RedditVideo } from "@/components/reddit/reddit-video";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { startRouteProgress } from "@/components/ui/route-progress";
import type { FeedPost } from "@/hooks/use-feed";
import { repostPost, voteOnPost } from "@/lib/api";
import { hasAttachedVideoContent } from "@/lib/embeds";
import { haptics } from "@/lib/haptics";
import { cleanPostHtml, removeDuplicateTitleFromBody } from "@/lib/html-sanitize";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl, getCollegeShortName } from "@/lib/utils";
import { PollCard } from "./poll-card";
import { ReportDialog } from "./report-dialog";
import { ShareStoryModal } from "./share-story-modal";

interface FeedCardProps {
  post: FeedPost;
  currentUserId?: string;
  disableNavigation?: boolean;
}

export function FeedCard({ post, currentUserId, disableNavigation }: FeedCardProps) {
  const router = useRouter();
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userVote, setUserVote] = useState(post.userVote);
  const collegeDisplayName = getCollegeShortName(post.institution);
  const [votesCount, setVotesCount] = useState(post.votesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);

  useEffect(() => {
    setUserVote(post.userVote);
    setVotesCount(post.votesCount);
    setCommentsCount(post.commentsCount);
  }, [post.userVote, post.votesCount, post.commentsCount]);

  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showShareStoryModal, setShowShareStoryModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [quoteThoughts, setQuoteThoughts] = useState("");
  const [isReposting, setIsReposting] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isBotPost = Boolean(
    post.pseudonym && (post.pseudonym.startsWith("🤖") || post.pseudonym.toLowerCase().includes("bot"))
  );
  const cleanBotPseudonym = post.pseudonym?.replace(/^[🤖\s]+/u, "").trim();

  const authorName = post.isAnonymous
    ? isBotPost
      ? cleanBotPseudonym || "Bot"
      : "Anonymous Student"
    : post.author?.displayName || "Student";
  const authorHandle = post.isAnonymous
    ? isBotPost
      ? cleanBotPseudonym || "bot"
      : post.pseudonym || "anonymous"
    : post.author?.username || "student";
  const avatarFallback = post.author?.displayName?.[0] ?? "S";
  const avatarUrl = post.isAnonymous
    ? ""
    : getAvatarUrl(post.author?.avatarUrl, post.author?.username ?? "student");

  const extractedHashtags = useMemo(() => {
    const text = post.body || "";
    const tags: string[] = [];
    const hashtagRegex = /#([\w-]+)/g;
    let match: RegExpExecArray | null;
    while ((match = hashtagRegex.exec(text)) !== null) {
      if (!tags.includes(match[1])) {
        tags.push(match[1]);
      }
    }
    return tags;
  }, [post.body]);

  const isBroadcast = useMemo(() => {
    return Boolean(
      post.title &&
        (post.title.includes("[OFFICIAL") ||
          post.title.includes("[URGENT") ||
          post.title.includes("[CAMPUS ALERT]") ||
          post.title.includes("[WARNING]") ||
          post.title.includes("[GENERAL INFO]") ||
          post.title.includes("[INFO]"))
    );
  }, [post.title]);

  const broadcastPriority = useMemo<"INFO" | "ANNOUNCEMENT" | "WARNING" | "URGENT">(() => {
    if (post.title?.includes("[URGENT")) return "URGENT";
    if (post.title?.includes("[CAMPUS ALERT]") || post.title?.includes("[WARNING]")) return "WARNING";
    if (post.title?.includes("[GENERAL INFO]") || post.title?.includes("[INFO]")) return "INFO";
    return "ANNOUNCEMENT";
  }, [post.title]);

  const cleanBroadcastTitle = useMemo(() => {
    if (!post.title) return "";
    return post.title
      .replace(/^\[(OFFICIAL ANNOUNCEMENT|URGENT NOTICE|CAMPUS ALERT|GENERAL INFO|WARNING|INFO)\]\s*/i, "")
      .trim();
  }, [post.title]);

  const ctaButton = useMemo(() => {
    if (!post.body) return null;
    const match = post.body.match(/👉\s*\[(.*?)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/i);
    if (!match) return null;
    return { label: match[1].trim(), url: match[2].trim() };
  }, [post.body]);

  const hasExternalVideo = useMemo(() => {
    return (
      Boolean(post.externalPost && post.externalPost.contentType === "VIDEO") ||
      Boolean(post.externalPost?.media?.some((m) => m.mediaType === "VIDEO"))
    );
  }, [post.externalPost]);

  const hasAttachedVideo = useMemo(() => {
    return (
      hasExternalVideo ||
      hasAttachedVideoContent(post.body) ||
      hasAttachedVideoContent(post.title)
    );
  }, [hasExternalVideo, post.body, post.title]);

  const displayContent = useMemo(() => {
    const rawBody = post.body || "";
    let cleaned = cleanPostHtml(rawBody);

    if (post.title) {
      cleaned = removeDuplicateTitleFromBody(cleaned, post.title);
    }

    const hasExternalGallery =
      Boolean(post.externalPost && post.externalPost.contentType === "GALLERY") ||
      Boolean(post.externalPost?.media && post.externalPost.media.length > 1);

    if (hasExternalVideo) {
      // The video player is already rendered via RedditVideo below the text.
      // Strip all video markdown tags (with any alt text) and raw video links from text body so it NEVER duplicates!
      cleaned = cleaned
        .replace(/!\[.*?\]\((?:https?:\/\/[^\s)]+|\/api\/files\/r2\/[^\s)]+)\)/gi, "")
        .replace(/https?:\/\/v\.redd\.it\/[^\s]+/gi, "")
        .replace(/https?:\/\/[^\s]+\.(?:mp4|webm|mov|m3u8)[^\s]*/gi, "")
        .trim();
    }

    if (hasExternalGallery) {
      cleaned = cleaned.replace(/!\[.*?\]\((?:https?:\/\/[^\s)]+|\/api\/files\/r2\/[^\s)]+)\)/gi, "").trim();
    }

    // Deduplicate any repeated identical media URLs in markdown
    const seenUrls = new Set<string>();
    cleaned = cleaned.replace(/!\[(.*?)\]\(([^)\s]+)\)/gi, (match, alt, url) => {
      if (seenUrls.has(url)) return "";
      seenUrls.add(url);
      return match;
    });

    // Hashtags are rendered as dedicated interactive chips below the body.
    // Remove a trailing hashtag-only block from the body so posts do not show
    // the same tags twice.
    cleaned = cleaned.replace(/(?:\n|\s)+(#[\w-]+(?:\s+#[\w-]+)*)\s*$/g, "").trim();

    if (isBroadcast) {
      cleaned = cleaned.replace(/👉\s*\[(.*?)\]\((?:https?:\/\/[^\s)]+|\/[^\s)]+)\)/gi, "").trim();
    }

    return cleaned.trim();
  }, [post.body, post.title, post.externalPost, isBroadcast]);

  async function handleVote() {
    if (isLoading) return;
    const isUpvoted = userVote === 1;
    const newValue = isUpvoted ? 0 : 1;
    const newCount = isUpvoted ? Math.max(0, votesCount - 1) : votesCount + 1;

    if (newValue === 1) {
      sounds.pop();
      haptics.medium();
    } else {
      haptics.light();
    }

    setUserVote(newValue);
    setVotesCount(newCount);
    setIsLoading(true);

    try {
      const data = await voteOnPost(post.id, newValue);
      setUserVote(data.userVote);
    } catch (error) {
      console.error(error);
      setUserVote(userVote);
      setVotesCount(votesCount);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCardClick(e?: React.MouseEvent) {
    if (disableNavigation) return;

    if (e) {
      const target = e.target as HTMLElement;
      if (
        target.closest("img") ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("[data-no-nav]") ||
        target.closest(".no-card-nav")
      ) {
        return;
      }

      if (e.detail === 2) {
        handleDoubleTap(e);
        return;
      }
    }

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      return;
    }
    sounds.tap();
    startRouteProgress();
    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null;
      router.push(`/post/${post.id}`);
    }, 240);
  }

  function handleDoubleTap(e: React.MouseEvent) {
    if (e) {
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("[data-no-nav]") ||
        target.closest(".no-card-nav")
      ) {
        return;
      }
      e.stopPropagation();
    }
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    sounds.pop();
    haptics.heartbeat();
    if (userVote !== 1) {
      handleVote();
    }
    setShowDoubleTapHeart(true);
    setTimeout(() => setShowDoubleTapHeart(false), 900);
  }

  async function handleSharePost() {
    sounds.tap();
    haptics.success();
    const postUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/post/${post.id}`
        : `https://campusloop.space/post/${post.id}`;
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${authorName} on CampusLoop`,
          text: post.body?.slice(0, 100),
          url: postUrl,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(postUrl);
      toast.success("Link copied to clipboard");
    }
  }

  async function handleExecuteRepost(isQuote: boolean) {
    setIsReposting(true);
    try {
      await repostPost(post.id, isQuote ? quoteThoughts : undefined);

      // Light, quick feedback — the button itself carries the animation
      sounds.tap();
      haptics.light();

      toast.success(isQuote ? "Quote posted" : "Reposted", {
        description: isQuote ? undefined : "Shared to your followers' feeds",
      });
      setShowRepostModal(false);
      setQuoteThoughts("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to repost");
    } finally {
      setIsReposting(false);
    }
  }

  return (
    <article
      onClick={(e) => handleCardClick(e)}
      onDoubleClick={handleDoubleTap}
      onMouseEnter={() => router.prefetch(`/post/${post.id}`)}
      className={cn(
        "w-full max-w-full min-w-0 border-b border-border/25 bg-card sm:rounded-2xl sm:border p-3 sm:p-4 mb-0 sm:mb-2.5 mx-0 relative cursor-pointer transition-all select-none overflow-x-clip shadow-2xs",
        isBroadcast && broadcastPriority === "URGENT" && "border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-card to-card ring-1 ring-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.12)]",
        isBroadcast && broadcastPriority === "WARNING" && "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card ring-1 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.12)]",
        isBroadcast && broadcastPriority === "INFO" && "border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-card to-card ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.12)]",
        isBroadcast && broadcastPriority === "ANNOUNCEMENT" && "border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card ring-1 ring-primary/20 shadow-[0_0_20px_rgba(147,51,234,0.12)]",
        !isBroadcast && "sm:border-border/30 hover:bg-muted/10"
      )}
    >
      {/* High-Priority Official Campus & Global Broadcast Banner Header */}
      {isBroadcast && (
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/30">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                broadcastPriority === "URGENT" && "bg-rose-500/20 text-rose-500 border-rose-500/30",
                broadcastPriority === "WARNING" && "bg-amber-500/20 text-amber-500 border-amber-500/30",
                broadcastPriority === "INFO" && "bg-blue-500/20 text-blue-500 border-blue-500/30",
                broadcastPriority === "ANNOUNCEMENT" && "bg-primary/20 text-primary border-primary/30"
              )}
            >
              {broadcastPriority === "URGENT" ? (
                <ShieldAlert className="size-3 shrink-0 animate-pulse" />
              ) : (
                <Megaphone className="size-3 shrink-0" />
              )}
              <span>
                {broadcastPriority === "URGENT"
                  ? "URGENT NOTICE"
                  : broadcastPriority === "WARNING"
                    ? "CAMPUS ADVISORY"
                    : broadcastPriority === "INFO"
                      ? "CAMPUS INFO"
                      : "OFFICIAL ANNOUNCEMENT"}
              </span>
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/30">
              {post.scope === "INDIA" ? (
                <>
                  <Globe className="size-3 text-primary" />
                  <span>Pan-India Broadcast</span>
                </>
              ) : (
                <>
                  <School className="size-3 text-primary" />
                  <span className="truncate max-w-[180px]">{collegeDisplayName || "Campus Wide"}</span>
                </>
              )}
            </span>
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            Priority Banner
          </span>
        </div>
      )}
      {/* Double Tap Flame Vibe Pop Overlay */}
      <AnimatePresence>
        {showDoubleTapHeart && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-orange-500/5 backdrop-blur-[1px]">
            <motion.div
              initial={{ scale: 0.2, opacity: 0, rotate: -15 }}
              animate={{ scale: [0.2, 1.45, 1.1], opacity: [0, 1, 0.95], rotate: [0, 8, 0] }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="relative"
            >
              <Flame className="h-20 w-20 fill-orange-500 text-orange-500 drop-shadow-[0_0_28px_rgba(249,115,22,0.85)]" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Repost Banner Header */}
      {post.repostOfId && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/75 font-medium pb-1.5 pl-1 select-none">
          <Repeat2 className="size-3 text-emerald-500/80 shrink-0" />
          <span>{authorName} Reposted</span>
        </div>
      )}

      {/* 1. TOP ROW: Clean Author Header (Avatar + Name/Handle/College/Time + Context Menu) */}
      <FeedCardHeader
        post={post}
        avatarSlot={
          !post.isAnonymous && post.author?.username ? (
            <Link
              href={`/@${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="relative block cursor-pointer group"
            >
              <Avatar className="size-10 rounded-full border-0 shadow-2xs group-hover:opacity-90 transition-opacity">
                <AvatarImage src={avatarUrl || ""} />
                <AvatarFallback className="font-bold text-xs bg-muted text-foreground">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              {post.externalPost && (
                <div
                  className="absolute -bottom-1 -right-1 size-4 rounded-full bg-[#FF4500] border-2 border-background flex items-center justify-center text-white shadow-xs"
                  title={`From r/${post.externalPost.subreddit || "reddit"}`}
                >
                  <svg className="size-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                  </svg>
                </div>
              )}
            </Link>
          ) : post.externalPost ? (
            <a
              href={post.externalPost.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block cursor-pointer"
              title={`From r/${post.externalPost.subreddit || "reddit"}`}
            >
              <div className="size-10 rounded-full border border-orange-500/30 bg-orange-500/10 flex items-center justify-center text-orange-500 hover:scale-105 hover:bg-orange-500/20 transition-all shadow-xs">
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                  </svg>
                </div>
              </a>
            ) : isBotPost ? (
              <Avatar className="size-10 rounded-full border border-sky-500/30 bg-sky-500/10">
                <AvatarFallback className="bg-transparent flex items-center justify-center">
                  <Bot className="size-5 text-sky-500 dark:text-sky-400" />
                </AvatarFallback>
              </Avatar>
            ) : !post.isAnonymous ? (
              <Link href={`/@${authorHandle}`} onClick={(e) => e.stopPropagation()}>
                <Avatar className="size-10 rounded-full border border-border/40 hover:opacity-90 transition-opacity">
                  <AvatarImage src={avatarUrl || ""} />
                  <AvatarFallback className="font-bold text-xs bg-muted text-foreground">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar className="size-10 rounded-full border border-purple-500/30 bg-purple-500/10">
                <AvatarFallback className="bg-transparent flex items-center justify-center">
                  <VenetianMask className="size-5 text-purple-400" />
                </AvatarFallback>
              </Avatar>
            )
          }
          currentUserId={currentUserId}
          onOpenRepostModal={() => setShowRepostModal(true)}
          onOpenReportModal={() => setShowReport(true)}
          onShare={handleSharePost}
        />

        {/* 2. CONTENT BODY: Placed directly below the author header taking 100% full width */}
        <div className="w-full min-w-0 space-y-1.5 pt-0.5 pb-0.5">
          {post.title && (
            <h3
              className={cn(
                "w-full text-[16px] font-bold tracking-tight leading-snug break-words",
                isBroadcast ? "text-base sm:text-lg font-black text-foreground" : "text-foreground"
              )}
            >
              {isBroadcast ? cleanBroadcastTitle : post.title}
            </h3>
          )}
          {displayContent && (
            <div className="w-full min-w-0 text-[15px] leading-relaxed text-foreground font-normal break-words [overflow-wrap:anywhere]">
              <RichText
                content={displayContent}
                createdAt={post.createdAt}
                collegeName={collegeDisplayName}
                hasAttachedVideo={hasAttachedVideo}
              />
            </div>
          )}

          {/* Action CTA Button if attached to broadcast */}
          {ctaButton && (
            <div className="pt-2 pb-1" onClick={(e) => e.stopPropagation()}>
              <a
                href={ctaButton.url}
                target={ctaButton.url.startsWith("http") ? "_blank" : undefined}
                rel={ctaButton.url.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer"
              >
                <span>{ctaButton.label}</span>
                <ArrowRight className="size-3" />
              </a>
            </div>
          )}

          {displayContent.length > 420 && (
            <button
              type="button"
              data-no-nav
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((value) => !value);
              }}
              className="cl-interactive mt-0.5 inline-flex min-h-8 items-center rounded-lg px-1.5 text-[11px] font-bold text-primary hover:bg-primary/8 hover:underline cursor-pointer"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* External Reddit Media Renderers (HTML5 Video / Gallery) */}
        {post.externalPost && post.externalPost.contentType === "VIDEO" && post.externalPost.media[0] && (
          <div className="w-full min-w-0 pt-0.5 pb-1" onClick={(e) => e.stopPropagation()}>
            <RedditVideo media={post.externalPost.media[0]} externalPost={post.externalPost} />
          </div>
        )}

        {post.externalPost &&
          post.externalPost.contentType === "GALLERY" &&
          post.externalPost.media.length > 0 && (
            <div className="w-full min-w-0 pt-0.5 pb-1" onClick={(e) => e.stopPropagation()}>
              <RedditGallery mediaList={post.externalPost.media} externalPost={post.externalPost} />
            </div>
          )}

        {/* Compact topic metadata / hashtags */}
        {extractedHashtags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 pb-1" onClick={(e) => e.stopPropagation()}>
            {extractedHashtags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/hashtag/${tag}`}
                className="min-h-6 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors shrink-0"
              >
                #{tag}
              </Link>
            ))}
            {extractedHashtags.length > 4 && (
              <span className="min-h-6 rounded-full bg-muted/30 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                +{extractedHashtags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Embedded Original Quoted Post */}
        {post.repostOf &&
          Boolean(post.repostComment) &&
          post.body?.trim() !== post.repostOf.body?.trim() && (
            <div className="w-full min-w-0 pb-1" onClick={(e) => e.stopPropagation()}>
              <Link href={`/post/${post.repostOf.id}`}>
                <div className="rounded-2xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <span className="font-bold text-foreground">
                      @{post.repostOf.author?.username || "student"}
                    </span>
                    {post.repostOf.institution?.name && (
                      <>
                        <span>·</span>
                        <span className="truncate text-[11px]">
                          {getCollegeShortName(post.repostOf.institution)}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-foreground/90 line-clamp-3 leading-relaxed">{post.repostOf.body}</p>
                </div>
              </Link>
            </div>
          )}

        {/* Poll Component */}
        {post.type === "POLL" && post.pollOptions && (
          <div className="w-full min-w-0 pb-1" onClick={(e) => e.stopPropagation()}>
            <PollCard post={post} />
          </div>
        )}

        {/* 3. FOOTER ROW: Action Bar aligned horizontally along the bottom */}
        <div className="w-full min-w-0 pt-0.5">
          {post.socialContext && (
            <div className="pb-1">
              <FeedSocialContextBar socialContext={post.socialContext} />
            </div>
          )}
          {(() => {
            const effectiveVotesCount = userVote === 1 && votesCount <= 0 ? 1 : votesCount;
            return (
              <>
                {effectiveVotesCount > 0 && disableNavigation && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLikesModal(true);
                    }}
                    className="flex items-center gap-1.5 pb-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer group w-fit"
                  >
                    <div className="size-4 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-500 shrink-0 shadow-2xs">
                      <Flame className="size-2.5 fill-orange-500 text-orange-500" />
                    </div>
                    <span className="font-semibold text-[11px] group-hover:underline">
                      {effectiveVotesCount === 1
                        ? "1 Vibe"
                        : `${effectiveVotesCount} Vibes`}
                    </span>
                  </div>
                )}

                <FeedCardActions
                  post={post}
                  userVote={userVote}
                  votesCount={effectiveVotesCount}
                  commentsCount={commentsCount}
                  onVote={handleVote}
                  onInstantRepost={() => handleExecuteRepost(false)}
                  onShare={handleSharePost}
                  onOpenComments={() => setShowCommentsModal(true)}
                  onOpenLikes={() => setShowLikesModal(true)}
                />
              </>
            );
          })()}
        </div>

      {/* Post Likes Modal (Facebook-style who liked list) */}
      <PostLikesModal
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        currentUserId={currentUserId}
      />

      {/* Fast Instagram-Style Comments Modal */}
      <FastCommentsModal
        post={post}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        onCommentCountChange={(newCount) => setCommentsCount(newCount)}
      />

      {/* Dialog Modals */}
      <FeedCardRepostModal
        isOpen={showRepostModal}
        onClose={() => setShowRepostModal(false)}
        quoteThoughts={quoteThoughts}
        setQuoteThoughts={setQuoteThoughts}
        isReposting={isReposting}
        onExecuteRepost={handleExecuteRepost}
        originalPostAuthorHandle={authorHandle}
      />

      <ReportDialog postId={post.id} isOpen={showReport} onClose={() => setShowReport(false)} />

      <ShareStoryModal
        post={post}
        isOpen={showShareStoryModal}
        onClose={() => setShowShareStoryModal(false)}
      />
    </article>
  );
}
