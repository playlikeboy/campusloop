import { useCallback, useEffect, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import type { Institution, Post, UserProfile } from "@/db/schema";
import { feedPagesCache, feedSizeCache, getPendingFeedPosts } from "@/lib/feed-mutations";
import { markPostsAsSeen } from "@/lib/seen-posts";

export type TopCommentPreview = {
  id: string;
  body: string;
  createdAt: Date | string;
  isAnonymous: boolean;
  pseudonym?: string | null;
  author?: {
    id?: string;
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
    points?: number | null;
  } | null;
};

export type ExternalPostMedia = {
  id: string;
  mediaType: "IMAGE" | "VIDEO" | "GIF" | "LINK";
  mediaUrl: string;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  hlsUrl?: string | null;
  dashUrl?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  isGif: boolean;
  position: number;
};

export type ExternalPostInfo = {
  id: string;
  source: "reddit" | "twitter" | "youtube";
  externalId: string;
  subreddit: string | null;
  externalAuthor: string | null;
  permalink: string;
  canonicalUrl: string;
  score: number;
  commentCount: number;
  contentType: "TEXT" | "IMAGE" | "VIDEO" | "GIF" | "GALLERY" | "LINK" | "OTHER";
  media: ExternalPostMedia[];
};

export type SocialActivityType = "LIKE" | "COMMENT" | "REPOST";

export type FeedSocialActor = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  actions: SocialActivityType[];
  latestAt: string;
};

export type FeedSocialContext = {
  actors: FeedSocialActor[];
  totalActors: number;
};

export type FeedPost = Post & {
  // Stripped to null by the server for anonymous posts.
  author: UserProfile | null;
  institution: Institution;
  community?: { id: string; name: string } | null;
  repostOf?: (Post & { author: UserProfile | null; institution?: Institution }) | null;
  votesCount: number;
  commentsCount: number;
  userVote: number;
  topComment?: TopCommentPreview | null;
  pollOptions?: {
    id: string;
    text: string;
    votesCount: number;
    userVoted: boolean;
  }[];
  hasVotedPoll?: boolean;
  totalPollVotes?: number;
  isSaved?: boolean;
  externalPost?: ExternalPostInfo | null;
  socialContext?: FeedSocialContext | null;
};

// Without a deadline a stalled request kept SWR in `isLoading` forever, so the
// feed showed skeletons indefinitely instead of the retryable error state.
const FEED_FETCH_TIMEOUT_MS = 15_000;

const feedFetcher = async <T>(url: string): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEED_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Failed to fetch feed");
    return (await res.json()) as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Feed took too long to load");
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const PAGE_LIMIT = 20;

function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2_147_483_647;
}

export function useFeed(
  scope: "CAMPUS" | "GLOBAL" = "CAMPUS",
  type?: string,
  sort?: string,
  visibility?: string,
  hashtag?: string,
  seed?: string | number
) {
  const cacheKey = `${scope}_${type || "ALL"}_${sort || "latest"}_${visibility || "all"}_${hashtag || ""}_${seed || ""}`;
  const initialSize = feedSizeCache.get(cacheKey) || 1;
  const fallbackData = feedPagesCache.get(cacheKey);

  // Freeze feed membership for the duration of a scroll session so new posts
  // cannot move items between pages while the user is reading.
  const snapshotKeyRef = useRef(cacheKey);
  const snapshotAtRef = useRef(new Date().toISOString());
  const sessionSeedRef = useRef(seed ?? hashStringToSeed(cacheKey));

  if (snapshotKeyRef.current !== cacheKey) {
    snapshotKeyRef.current = cacheKey;
    snapshotAtRef.current = new Date().toISOString();
    sessionSeedRef.current = seed ?? hashStringToSeed(cacheKey);
  }

  const effectiveSeed = sort === "random" ? sessionSeedRef.current : seed;

  const getKey = (pageIndex: number, previousPageData: FeedPost[] | null) => {
    if (previousPageData && previousPageData.length < PAGE_LIMIT) return null;

    const url = new URL(
      "/api/feed",
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    );
    url.searchParams.set("scope", scope);
    if (type && type !== "ALL") url.searchParams.set("type", type);
    if (sort) url.searchParams.set("sort", sort);
    if (visibility && visibility !== "all") url.searchParams.set("visibility", visibility);
    if (hashtag) url.searchParams.set("hashtag", hashtag);
    if (effectiveSeed !== undefined) url.searchParams.set("seed", String(effectiveSeed));
    url.searchParams.set("before", snapshotAtRef.current);
    url.searchParams.set("page", String(pageIndex + 1));
    url.searchParams.set("limit", String(PAGE_LIMIT));

    return url.toString();
  };

  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<FeedPost[]>(
    getKey,
    feedFetcher,
    {
      initialSize,
      fallbackData,
      // Only the first page is refetched: later pages are append-only history,
      // so revalidating all of them on every focus would be wasteful.
      revalidateFirstPage: true,
      revalidateAll: false,
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 2,
      errorRetryInterval: 2000,
      // The cached pages stay on screen while the refresh runs, so returning to
      // the feed never flashes a skeleton over content we already have.
      keepPreviousData: true,
    }
  );

  // Sync cache on updates
  useEffect(() => {
    if (data && data.length > 0) {
      feedPagesCache.set(cacheKey, data);
    }
  }, [cacheKey, data]);

  const handleSetSize = useCallback(
    (sizeOrFn: number | ((size: number) => number)) => {
      setSize((prev) => {
        const next = typeof sizeOrFn === "function" ? sizeOrFn(prev) : sizeOrFn;
        feedSizeCache.set(cacheKey, next);
        return next;
      });
    },
    [cacheKey, setSize]
  );

  const refresh = useCallback(async () => {
    feedSizeCache.set(cacheKey, 1);
    snapshotAtRef.current = new Date().toISOString();
    if (sort === "random") {
      sessionSeedRef.current = Math.floor(Math.random() * 2_147_483_647);
    }
    return mutate();
  }, [cacheKey, mutate, sort]);

  const rawFeed = (data || fallbackData)?.flat();
  // Posts published moments ago sit on top until the API starts returning
  // them, so the author always sees their post land in the feed.
  const pending = rawFeed ? getPendingFeedPosts() : [];
  const merged = rawFeed ? [...pending, ...rawFeed] : undefined;
  const feed = merged ? Array.from(new Map(merged.map((post) => [post.id, post])).values()) : undefined;

  // Track impressions when feed items load
  useEffect(() => {
    if (feed && feed.length > 0) {
      markPostsAsSeen(feed.slice(0, 25).map((p) => p.id));
    }
  }, [feed]);

  const isReachingEnd = Boolean(
    data && (data.length === 0 || (data[data.length - 1] && data[data.length - 1].length < PAGE_LIMIT))
  );
  const isLoadingMore = Boolean(
    isLoading || (isValidating && size > 1) || (size > 0 && data && typeof data[size - 1] === "undefined")
  );

  return {
    feed,
    isLoading,
    isLoadingMore,
    isValidating,
    isReachingEnd,
    isError: error,
    size,
    setSize: handleSetSize,
    mutate,
    refresh,
  };
}

export { useStories } from "./use-stories";
