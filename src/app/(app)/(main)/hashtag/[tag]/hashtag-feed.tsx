"use client";

import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Code2,
  Copy,
  Flame,
  Globe2,
  GraduationCap,
  Hash,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Share2,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { FeedCard } from "@/components/ui/feed-card";
import { FeedSkeleton } from "@/components/ui/skeleton-card";
import { useFeed } from "@/hooks/use-feed";
import { useProfile } from "@/hooks/use-profile";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { getHashtagTheme, type HashtagTheme } from "@/lib/hashtag-meta";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface HashtagApiResponse {
  theme: HashtagTheme;
  stats: {
    postsCount: number;
    collegesCount: number;
    mediaPostsCount: number;
    topColleges: Array<{
      id: string;
      name: string;
      short_name: string | null;
      count: number;
    }>;
  };
}

export default function HashtagFeed() {
  const params = useParams();
  const rawTag = typeof params.tag === "string" ? params.tag : "";
  const tag = decodeURIComponent(rawTag).replace(/^#/, "").trim();

  const { profile } = useProfile();
  const [scope, setScope] = useState<"GLOBAL" | "CAMPUS">("GLOBAL");
  const [activeTab, setActiveTab] = useState<"top" | "latest" | "media" | "polls">("top");
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch hashtag metadata & real-time aggregated stats
  const { data: hashtagData } = useSWR<HashtagApiResponse>(
    tag ? `/api/hashtags/${encodeURIComponent(tag)}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const theme = useMemo(() => {
    return hashtagData?.theme || getHashtagTheme(tag);
  }, [hashtagData?.theme, tag]);

  // Feed query parameters mapped from tabs
  const feedType = activeTab === "media" ? "MEDIA" : activeTab === "polls" ? "POLL" : "ALL";
  const feedSort = activeTab === "top" ? "top" : "latest";

  const {
    feed,
    isLoading: feedLoading,
    isLoadingMore,
    isReachingEnd,
    size,
    setSize,
  } = useFeed(scope, feedType, feedSort, "all", tag);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef || isReachingEnd || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
          setSize((s) => s + 1);
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    );

    observer.observe(loadMoreRef);
    return () => observer.disconnect();
  }, [loadMoreRef, isReachingEnd, isLoadingMore, setSize]);

  async function handleShareTopic() {
    sounds.tap();
    haptics.light();
    const url = `https://campusloop.space/hashtag/${encodeURIComponent(tag)}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success(`Copied link to #${tag}! 🔗`);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Failed to copy link");
      }
    }
  }

  // Pick dynamic icon based on theme
  const TopicIcon = useMemo(() => {
    switch (theme.iconName) {
      case "UtensilsCrossed":
        return UtensilsCrossed;
      case "Code2":
        return Code2;
      case "Briefcase":
        return Briefcase;
      case "BookOpen":
        return BookOpen;
      case "Flame":
        return Flame;
      case "Sparkles":
        return Sparkles;
      default:
        return Hash;
    }
  }, [theme.iconName]);

  const stats = hashtagData?.stats;
  const userCollege = profile?.institution?.name || "My Campus";

  return (
    <main className="min-h-screen bg-background text-foreground pb-28 mx-auto max-w-2xl border-x border-border/20">
      {/* ─── Sticky Minimal Top Navigation ─── */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/30 px-3.5 py-2 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/feeds"
            className="flex size-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            aria-label="Back to feed"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-tight text-foreground truncate flex items-center gap-1.5">
              <span>#{theme.tag}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                {theme.category}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShareTopic}
            className="size-8 rounded-full border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="Share this topic"
            aria-label="Share topic"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
          </button>

          <Link
            href={`/post/new?tag=${encodeURIComponent(tag)}`}
            className="h-8 px-3.5 rounded-full bg-foreground text-background hover:opacity-90 font-black text-xs transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Plus className="size-3.5" />
            <span>Post</span>
          </Link>
        </div>
      </header>

      {/* ─── Topic Clean Header Card ─── */}
      <div className="px-4 py-4 sm:py-5 border-b border-border/30 bg-card/40 space-y-3">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <TopicIcon className="size-5.5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black tracking-tight text-foreground">
                #{theme.tag}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold">
                <Flame className="size-3 text-primary" />
                <span>Trending Topic</span>
              </span>
            </div>

            {theme.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {theme.description}
              </p>
            )}

            {/* Subtle Inline Statistics Row */}
            <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <MessageCircle className="size-3 text-muted-foreground" />
                <span>{stats ? stats.postsCount : 0} posts</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <Building2 className="size-3 text-muted-foreground" />
                <span>{stats ? Math.max(1, stats.collegesCount) : 1} colleges</span>
              </span>
              {stats && stats.mediaPostsCount > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <ImageIcon className="size-3 text-muted-foreground" />
                    <span>{stats.mediaPostsCount} media</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Top Campus Hubs Talking About This */}
        {stats && stats.topColleges && stats.topColleges.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-muted-foreground border-t border-border/20">
            <span className="font-semibold text-foreground/80 shrink-0 text-[11px]">Popular at:</span>
            {stats.topColleges.map((col) => (
              <span
                key={col.id}
                className="px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-[10px] font-medium border border-border/30 truncate max-w-[140px]"
              >
                {col.short_name || col.name.split(",")[0]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── Related Tags Pill Bar ─── */}
      {theme.relatedTags.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border/20 bg-muted/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 shrink-0 mr-1 flex items-center gap-1">
            <TrendingUp className="size-3" />
            <span>Related</span>
          </span>
          {theme.relatedTags.map((rTag) => {
            const cleanRTag = rTag.replace(/^#/, "");
            const isCurrent = cleanRTag.toLowerCase() === tag.toLowerCase();
            return (
              <Link
                key={rTag}
                href={`/hashtag/${encodeURIComponent(cleanRTag)}`}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer",
                  isCurrent
                    ? "bg-foreground text-background font-black shadow-2xs"
                    : "bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {rTag}
              </Link>
            );
          })}
        </div>
      )}

      {/* ─── Scope & Content Filter Tabs (Single Consolidated Sticky Row) ─── */}
      <div className="sticky top-12 z-30 bg-background/95 backdrop-blur-md border-b border-border/25 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Scope Pill Switcher */}
        <div className="flex items-center p-0.5 rounded-full bg-muted/50 border border-border/40 text-[11px] font-semibold shrink-0">
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              setScope("GLOBAL");
            }}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
              scope === "GLOBAL"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe2 className="size-3" />
            <span>All India</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.tap();
              setScope("CAMPUS");
            }}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer max-w-[100px] sm:max-w-[140px] truncate",
              scope === "CAMPUS"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="size-3" />
            <span className="truncate">{userCollege}</span>
          </button>
        </div>

        <div className="h-4 w-px bg-border/40 shrink-0" />

        {/* Content Stream Tabs */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("top")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1",
              activeTab === "top"
                ? "bg-foreground text-background font-bold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Flame className="size-3" />
            <span>Top</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("latest")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1",
              activeTab === "latest"
                ? "bg-foreground text-background font-bold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Sparkles className="size-3" />
            <span>Latest</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1",
              activeTab === "media"
                ? "bg-foreground text-background font-bold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <ImageIcon className="size-3" />
            <span>Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("polls")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1",
              activeTab === "polls"
                ? "bg-foreground text-background font-bold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <BarChart3 className="size-3" />
            <span>Polls</span>
          </button>
        </div>
      </div>

      {/* ─── Fast Inline Prompt Capsule (Desktop only to prevent mobile clutter) ─── */}
      <div className="hidden sm:block px-4 py-3 bg-muted/20 border-b border-border/20">
        <Link
          href={`/post/new?tag=${encodeURIComponent(tag)}`}
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-card border border-border/50 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
              <TopicIcon className="size-3.5" />
            </div>
            <span className="text-xs truncate">
              {theme.prompts[0] || `Share your thoughts on #${tag}...`}
            </span>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-foreground text-background shrink-0">
            Share
          </span>
        </Link>
      </div>

      {/* ─── Feed Posts Stream ─── */}
      <div className="flex flex-col divide-y divide-border/20">
        {feedLoading && size === 1 ? (
          <FeedSkeleton />
        ) : feed && feed.length > 0 ? (
          <>
            {feed.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}

            {/* Infinite scroll trigger */}
            {!isReachingEnd && (
              <div
                ref={setLoadMoreRef}
                className="flex items-center justify-center py-8 text-xs font-bold text-muted-foreground/80"
              >
                <span className="animate-pulse">Loading more #{theme.tag} posts...</span>
              </div>
            )}

            {isReachingEnd && (
              <div className="text-center py-10 text-xs font-bold text-muted-foreground/60 select-none">
                You&apos;ve caught up on all posts for #{theme.tag}!
              </div>
            )}
          </>
        ) : (
          /* Creative Empty State with Theme Prompts */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="size-16 rounded-3xl bg-muted/40 border border-border/80 flex items-center justify-center mb-4 text-primary shadow-xs">
              <TopicIcon className={cn("size-8", theme.accentColor)} />
            </div>

            <h3 className="font-black text-foreground text-base">#{theme.tag} is waiting for you</h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
              No campus posts have used #{theme.tag} in this view yet. Start the conversation with one of these ideas:
            </p>

            {/* Prompt Suggestion Chips */}
            <div className="mt-4 flex flex-col gap-2 w-full max-w-sm">
              {theme.prompts.map((prompt) => (
                <Link
                  key={prompt}
                  href={`/post/new?tag=${encodeURIComponent(tag)}&initialText=${encodeURIComponent(`${prompt} #${tag} `)}`}
                  className="px-3 py-2 rounded-xl bg-card border border-border/50 hover:border-primary/40 text-xs text-left text-foreground hover:bg-muted/40 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <span className="truncate">&ldquo;{prompt}&rdquo;</span>
                  <Plus className="size-3 text-muted-foreground group-hover:text-primary shrink-0" />
                </Link>
              ))}
            </div>

            <Link
              href={`/post/new?tag=${encodeURIComponent(tag)}`}
              className="mt-6 py-2.5 px-6 rounded-full bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="size-4" />
              <span>Create first post for #{theme.tag}</span>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
