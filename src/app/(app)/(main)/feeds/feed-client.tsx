"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CampusBroadcastBanner } from "@/components/feed/campus-broadcast-banner";
import { FeedAcademicsSpotlight } from "@/components/feed/feed-academics-spotlight";
import { FeedEventSpotlight } from "@/components/feed/feed-event-spotlight";
import { FeedHeader } from "@/components/feed/feed-header";
import { FeedMarketplaceSpotlight } from "@/components/feed/feed-marketplace-spotlight";
import { FeedQuickComposer } from "@/components/feed/feed-quick-composer";
import { FeedRecommendedUsers } from "@/components/feed/feed-recommended-users";
import { FeedCaughtUpCard, FeedEmptyState, FeedErrorState } from "@/components/feed/feed-state-cards";
import { LocationOptInCard } from "@/components/geo/location-opt-in-card";
import { Button } from "@/components/ui/button";
import { FeedCard } from "@/components/ui/feed-card";
import { InlineCommunitiesWidget } from "@/components/ui/inline-feed-widgets";
import { RightSidebar } from "@/components/ui/right-sidebar";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { FeedLoadingMoreSkeleton, FeedSkeleton } from "@/components/ui/skeleton-card";
import { StoryRing } from "@/components/ui/story-ring";
import { type FeedPost, useFeed, useStories } from "@/hooks/use-feed";
import { useFeedImpressions } from "@/hooks/use-feed-impressions";
import { useProfile } from "@/hooks/use-profile";
import { isCollegeVerifiedUser } from "@/lib/user-verification";
import { getCollegeShortName } from "@/lib/utils";

function readSavedVisibility(): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("campusloop_feed_visibility") : null;
  } catch {
    return null;
  }
}

export function FeedClient({ forcedType }: { forcedType?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Dashboard state synced with URL
  const initialScope = (searchParams.get("scope") as "CAMPUS" | "GLOBAL") || "GLOBAL";
  const [scope, setScopeState] = useState<"CAMPUS" | "GLOBAL">(initialScope);
  const initialType = forcedType || searchParams.get("type") || "ALL";
  const [type, setTypeState] = useState<string>(initialType);
  const sortParam = searchParams.get("sort") || "for_you";
  const [sort, setSortState] = useState<string>(sortParam);
  const [visibility, setVisibility] = useState<string>("all");
  const { profile } = useProfile();
  const trackImpression = useFeedImpressions(Boolean(profile?.id), sort);

  useEffect(() => {
    if (forcedType) {
      setTypeState(forcedType);
      return;
    }
    const currentScope = searchParams.get("scope") as "CAMPUS" | "GLOBAL";
    if (currentScope && currentScope !== scope) {
      setScopeState(currentScope);
    }
    const currentSort = searchParams.get("sort");
    if (currentSort && currentSort !== sort) {
      setSortState(currentSort);
    }
    const currentType = searchParams.get("type");
    if (currentType && currentType !== type) {
      setTypeState(currentType);
    }
  }, [searchParams, scope, sort, type, forcedType]);

  function handleScopeChange(newScope: "CAMPUS" | "GLOBAL") {
    setScopeState(newScope);
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", newScope);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleTypeChange(newType: string) {
    setTypeState(newType);
    if (newType === "ALL") {
      router.push("/feeds");
    } else {
      router.push(`/posts/${newType}`);
    }
  }

  function handleSortChange(newSort: string) {
    setSortState(newSort);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    if (newSort === "memes") {
      params.set("type", "MEME");
      setTypeState("MEME");
    } else if (type === "MEME") {
      params.delete("type");
      setTypeState("ALL");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    const savedMode = readSavedVisibility();
    const mode = profile?.feedVisibility ?? savedMode ?? "ALL";
    setVisibility(mode === "NON_ANONYMOUS" ? "public" : "all");

    function handleSync(e: CustomEvent<string>) {
      const activeMode = e.detail || readSavedVisibility() || "ALL";
      setVisibility(activeMode === "NON_ANONYMOUS" ? "public" : "all");
    }

    if (typeof window !== "undefined") {
      window.addEventListener("campusloop_feed_visibility_change" as any, handleSync as any);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("campusloop_feed_visibility_change" as any, handleSync as any);
      }
    };
  }, [profile?.feedVisibility]);

  function handleVisibilityChange(newVis: string) {
    setVisibility(newVis);
    const newMode = newVis === "public" ? "NON_ANONYMOUS" : "ALL";
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("campusloop_feed_visibility", newMode);
      } catch {
        // Private mode or blocked storage: the choice still applies for this visit.
      }
      window.dispatchEvent(new CustomEvent("campusloop_feed_visibility_change", { detail: newMode }));
    }
  }

  const {
    feed,
    isLoading: feedLoading,
    isLoadingMore,
    isValidating,
    isReachingEnd,
    isError,
    setSize,
    mutate,
    refresh,
  } = useFeed(scope, type, sort, visibility);

  const displayedPosts: FeedPost[] = useMemo(() => {
    if (!feed) return [];
    const seen = new Set<string>();
    const uniquePosts: FeedPost[] = [];

    for (const post of feed) {
      if (!post?.id || seen.has(post.id)) continue;
      // In Verified / Public Only mode, hide anonymous posts, confessions, AND posts from non-college-verified (Gmail) users
      if (visibility === "public") {
        if (post.isAnonymous || post.type === "CONFESSION") {
          continue;
        }
        if (!post.author?.isCollegeVerified && !isCollegeVerifiedUser(post.author)) {
          continue;
        }
      }
      seen.add(post.id);
      uniquePosts.push(post);
    }

    return uniquePosts;
  }, [feed, visibility]);

  const { stories, mutate: mutateStories, isLoading: storiesLoading } = useStories();

  // Infinite scroll trigger ref and observer with 600px prefetch rootMargin
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef || isReachingEnd || isLoadingMore || isError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSize((s) => s + 1);
        }
      },
      { threshold: 0.05, rootMargin: "600px" }
    );

    observer.observe(loadMoreRef);
    return () => observer.disconnect();
  }, [loadMoreRef, isReachingEnd, isLoadingMore, isError, setSize]);

  const storyUsers = (stories || [])
    .filter((s) => s?.user)
    .map((s) => ({
      id: s.user.id,
      displayName: s.user.displayName,
      username: s.user.username,
      avatarUrl: s.user.avatarUrl,
      stories: s.stories,
    }));

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1020px] items-start justify-center gap-8 pb-28">
        <main className="flex min-h-dvh w-full max-w-[640px] min-w-0 flex-col bg-bg text-fg sm:border-x border-border pb-20 sm:pb-8">
          <FeedHeader
            scope={scope}
            onScopeChange={handleScopeChange}
            sort={sort}
            onSortChange={handleSortChange}
            type={type}
            onTypeChange={handleTypeChange}
            visibility={visibility}
            onVisibilityChange={handleVisibilityChange}
            institutionSlug={
              (profile?.institution?.name && getCollegeShortName({ name: profile.institution.name })) ||
              profile?.institution?.slug ||
              "Campus"
            }
            onRefresh={refresh}
            isRefreshing={isValidating}
          />

          {/* Stories only take space when someone has actually posted one. */}
          {!storiesLoading && storyUsers.length > 0 && (
            <section className="w-full min-w-0" aria-label="Stories">
              <StoryRing users={storyUsers} mutateStories={mutateStories} />
            </section>
          )}

          <FeedQuickComposer profile={profile} scope={scope} />

          <CampusBroadcastBanner scope={scope} institutionId={profile?.institutionId} />

          <div className="flex flex-col">
            {feedLoading && (!feed || feed.length === 0) ? (
              <FeedSkeleton />
            ) : isError && (!feed || feed.length === 0) ? (
              <FeedErrorState onRetry={() => refresh()} />
            ) : displayedPosts.length > 0 ? (
              <>
                {displayedPosts.map((post, idx) => (
                  <div key={post.id}>
                    <div ref={trackImpression} data-feed-post-id={post.id}>
                      <FeedCard post={post} currentUserId={profile?.id} />
                    </div>
                    {/* A few calm discovery slots between posts, spaced out so the feed stays about people. */}
                    {idx === 1 && <LocationOptInCard enabled={Boolean(profile?.id)} className="mx-3 my-3" />}
                    {idx === 3 && (
                      <div className="border-b border-border">
                        <FeedEventSpotlight />
                      </div>
                    )}
                    {idx === 6 && (
                      <div className="border-b border-border lg:hidden">
                        <FeedRecommendedUsers />
                      </div>
                    )}
                    {idx === 10 && (
                      <div className="border-b border-border">
                        <FeedAcademicsSpotlight />
                      </div>
                    )}
                    {idx === 15 && (
                      <div className="border-b border-border">
                        <FeedMarketplaceSpotlight />
                      </div>
                    )}
                    {idx === 21 && (
                      <div className="border-b border-border p-4">
                        <InlineCommunitiesWidget />
                      </div>
                    )}
                  </div>
                ))}

                {!isReachingEnd && (
                  <div ref={setLoadMoreRef} className="w-full">
                    {isError ? (
                      <div className="flex justify-center py-6">
                        <Button variant="ghost" size="sm" onClick={() => mutate()}>
                          Couldn&apos;t load more. Try again
                        </Button>
                      </div>
                    ) : (
                      <FeedLoadingMoreSkeleton />
                    )}
                  </div>
                )}

                {isReachingEnd && <FeedCaughtUpCard />}
              </>
            ) : (
              <FeedEmptyState />
            )}
          </div>
        </main>

        <aside className="hidden w-[340px] shrink-0 lg:block">
          <RightSidebar />
        </aside>
      </div>

      <ScrollToTop />
    </>
  );
}
