"use client";

import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Code2,
  Flame,
  Globe2,
  Hash,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Plus,
  Share2,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedCard } from "@/components/ui/feed-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
        toast.success("Link copied");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Couldn't copy the link. Copy it from the address bar.");
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
      default:
        return Hash;
    }
  }, [theme.iconName]);

  const stats = hashtagData?.stats;
  const userCollege = profile?.institution?.name || "My Campus";

  const newPostHref = `/post/new?tag=${encodeURIComponent(tag)}`;
  const tabs = [
    { value: "top" as const, label: "Top" },
    { value: "latest" as const, label: "Latest" },
    { value: "media" as const, label: "Media" },
    { value: "polls" as const, label: "Polls" },
  ];

  return (
    <main className="min-h-screen bg-bg text-fg pb-28 mx-auto max-w-2xl sm:border-x border-border">
      <header className="sticky top-12 lg:top-0 z-30 bg-bg border-b border-border px-2 py-1.5 flex items-center justify-between gap-2">
        <Link
          href="/feeds"
          className="flex size-11 items-center justify-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg transition-ui shrink-0"
          aria-label="Back to feed"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShareTopic}
            aria-label={copied ? "Link copied" : `Copy link to #${theme.tag}`}
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
          </Button>
          <Button asChild size="sm">
            <Link href={newPostHref}>
              <Plus className="size-4" aria-hidden />
              Post
            </Link>
          </Button>
        </div>
      </header>

      <section className="px-4 py-5 border-b border-border space-y-3" aria-labelledby="hashtag-title">
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-md bg-surface-muted flex items-center justify-center text-fg-muted shrink-0">
            <TopicIcon className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 id="hashtag-title" className="text-2xl break-words">
              #{theme.tag}
            </h1>
            <p className="text-sm text-fg-muted">{theme.category}</p>
          </div>
        </div>

        {theme.description && <p className="text-sm text-fg-muted max-w-prose">{theme.description}</p>}

        {stats && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted tabular-nums">
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-4" aria-hidden />
              {stats.postsCount} {stats.postsCount === 1 ? "post" : "posts"}
            </span>
            {stats.collegesCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-4" aria-hidden />
                {stats.collegesCount} {stats.collegesCount === 1 ? "college" : "colleges"}
              </span>
            )}
            {stats.mediaPostsCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="size-4" aria-hidden />
                {stats.mediaPostsCount} with photos or videos
              </span>
            )}
          </p>
        )}

        {stats?.topColleges && stats.topColleges.length > 0 && (
          <p className="text-sm text-fg-muted">
            Most used at{" "}
            <span className="text-fg">
              {stats.topColleges.map((col) => col.short_name || col.name.split(",")[0]).join(", ")}
            </span>
          </p>
        )}

        {theme.relatedTags.length > 0 && (
          <nav
            aria-label="Related tags"
            className="-mx-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar px-4 pt-1"
          >
            {theme.relatedTags.map((rTag) => {
              const cleanRTag = rTag.replace(/^#/, "");
              const isCurrent = cleanRTag.toLowerCase() === tag.toLowerCase();
              return (
                <Link
                  key={rTag}
                  href={`/hashtag/${encodeURIComponent(cleanRTag)}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "inline-flex h-8 items-center px-3 rounded-full text-xs font-medium transition-ui shrink-0",
                    isCurrent
                      ? "bg-brand text-brand-fg"
                      : "bg-surface-muted text-fg-muted hover:bg-surface-sunken hover:text-fg"
                  )}
                >
                  {rTag}
                </Link>
              );
            })}
          </nav>
        )}
      </section>

      <div className="sticky top-[6.5rem] lg:top-14 z-20 bg-bg border-b border-border px-4 py-2 flex flex-wrap items-center gap-2">
        <SegmentedControl
          size="sm"
          value={scope}
          onChange={setScope}
          options={[
            { value: "GLOBAL", label: "All colleges", icon: <Globe2 className="size-3.5" aria-hidden /> },
            { value: "CAMPUS", label: userCollege, icon: <Building2 className="size-3.5" aria-hidden /> },
          ]}
        />
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <Chip
              key={t.value}
              size="sm"
              selected={activeTab === t.value}
              onClick={() => setActiveTab(t.value)}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        {feedLoading && size === 1 ? (
          <FeedSkeleton />
        ) : feed && feed.length > 0 ? (
          <>
            {feed.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}

            {!isReachingEnd && (
              <div
                ref={setLoadMoreRef}
                className="flex items-center justify-center gap-2 py-8 text-sm text-fg-muted"
                role="status"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading more…
              </div>
            )}

            {isReachingEnd && (
              <p className="text-center py-10 text-sm text-fg-muted">
                You&apos;re all caught up on #{theme.tag}
              </p>
            )}
          </>
        ) : (
          <EmptyState
            icon={TopicIcon}
            title={`No posts with #${theme.tag} yet`}
            description="Start it off. Your post will show up here."
            action={
              <div className="flex w-full max-w-sm flex-col items-center gap-3">
                <Button asChild>
                  <Link href={newPostHref}>Write the first post</Link>
                </Button>
                {theme.prompts.length > 0 && (
                  <ul className="w-full space-y-1.5 text-left" aria-label="Ideas to post about">
                    {theme.prompts.map((prompt) => (
                      <li key={prompt}>
                        <Link
                          href={`${newPostHref}&initialText=${encodeURIComponent(`${prompt} #${tag} `)}`}
                          className="flex min-h-11 items-center justify-between gap-2 rounded-md bg-surface-muted px-3 text-sm text-fg hover:bg-surface-sunken transition-ui"
                        >
                          <span className="truncate">{prompt}</span>
                          <Plus className="size-4 shrink-0 text-fg-muted" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            }
          />
        )}
      </div>
    </main>
  );
}
