"use client";

import { MessageSquare, Plus, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedCard } from "@/components/ui/feed-card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { FeedPost } from "@/hooks/use-feed";
import { haptics } from "@/lib/haptics";
import { CommunityList } from "./community-row";

export interface CommunityMemberWithUser {
  userId: string;
  status: string;
  user?: {
    id: string;
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface CommunityItem {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  privacy: "PUBLIC" | "PRIVATE" | "UNLISTED" | string;
  category: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  points?: number;
  creatorId: string;
  createdAt: Date;
  members: CommunityMemberWithUser[];
  creator?: {
    id: string;
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

interface Props {
  initialCommunities: CommunityItem[];
  featuredCommunities?: CommunityItem[];
  initialPosts?: FeedPost[];
  profileId: string;
  page: number;
  totalPages: number;
  totalCount: number;
  myCommunityCount: number;
  categoryCounts?: Record<string, number>;
  postCountsMap?: Record<string, number>;
  currentSort?: string;
}

const CATEGORY_DEFINITIONS = [
  { id: "All", label: "All" },
  { id: "Tech & Coding", label: "Tech & coding" },
  { id: "Academics & Placements", label: "Study & placements" },
  { id: "Campus Life", label: "Campus life" },
  { id: "Gaming & Anime", label: "Gaming & anime" },
  { id: "Music & Arts", label: "Music & arts" },
  { id: "Career & Startups", label: "Careers & startups" },
  { id: "Sports & Fitness", label: "Sports & fitness" },
  { id: "Campus Services", label: "Campus services" },
] as const;

const TABS = [
  { id: "explore", label: "Explore" },
  { id: "feed", label: "Posts" },
  { id: "my_communities", label: "Joined" },
] as const;

const SORT_OPTIONS = [
  { id: "trending", label: "Popular" },
  { id: "newest", label: "New" },
  { id: "name", label: "A to Z" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function CommunitiesIndexClient({
  initialCommunities,
  featuredCommunities: _featuredCommunities = [],
  initialPosts = [],
  profileId,
  page,
  totalPages,
  totalCount: _totalCount,
  myCommunityCount,
  categoryCounts = {},
  postCountsMap = {},
  currentSort = "trending",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTab = searchParams.get("tab");
  const activeTab: Tab = urlTab === "feed" || urlTab === "my_communities" ? urlTab : "explore";
  const selectedCategory = searchParams.get("category") || "All";
  const urlSearch = searchParams.get("q") || "";
  const [search, setSearch] = useState(urlSearch);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const updateUrl = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutator(params);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: true });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const next = search.trim();
    if (next === urlSearch) return;

    const timer = window.setTimeout(() => {
      updateUrl((params) => {
        if (next) params.set("q", next);
        else params.delete("q");
        params.set("page", "1");
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, updateUrl, urlSearch]);

  function handleTabChange(tab: Tab) {
    haptics.light();
    updateUrl((params) => {
      if (tab === "explore") params.delete("tab");
      else params.set("tab", tab);
      params.set("page", "1");
      if (tab !== "explore") {
        params.delete("category");
        params.delete("sort");
      }
      if (tab === "my_communities") params.delete("q");
    });
  }

  function handleCategoryChange(category: string) {
    haptics.light();
    updateUrl((params) => {
      if (category === "All") params.delete("category");
      else params.set("category", category);
      params.set("page", "1");
    });
  }

  function handleSortChange(sort: string) {
    haptics.light();
    updateUrl((params) => {
      if (sort === "trending") params.delete("sort");
      else params.set("sort", sort);
      params.set("page", "1");
    });
  }

  const searchBox = (label: string, placeholder: string) => (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="pr-11 pl-10"
      />
      {search ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSearch("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-1 -translate-y-1/2"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-4 px-4 pt-4 pb-24 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-fg">Communities</h1>
          <p className="mt-1 text-sm text-fg-muted">Clubs, branch groups and interest circles.</p>
        </div>
        <Button asChild>
          <Link href="/communities/new">
            <Plus />
            Start a community
          </Link>
        </Button>
      </header>

      <SegmentedControl
        aria-label="View"
        value={activeTab}
        onChange={handleTabChange}
        fullWidth
        className="sm:w-96"
        options={TABS.map((t) => ({
          value: t.id,
          label:
            t.id === "my_communities" && myCommunityCount > 0 ? `${t.label} (${myCommunityCount})` : t.label,
        }))}
      />

      {activeTab === "explore" && (
        <div className="space-y-4">
          {searchBox("Search communities", "Search clubs and interests")}

          <fieldset className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <legend className="sr-only">Category</legend>
            {CATEGORY_DEFINITIONS.map((def) => (
              <Chip
                key={def.id}
                size="sm"
                selected={selectedCategory === def.id}
                count={categoryCounts[def.id] || undefined}
                onClick={() => handleCategoryChange(def.id)}
              >
                {def.label}
              </Chip>
            ))}
          </fieldset>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-fg-muted">Sort by</span>
            <SegmentedControl
              aria-label="Sort"
              size="sm"
              value={
                (SORT_OPTIONS.some((o) => o.id === currentSort)
                  ? currentSort
                  : "trending") as (typeof SORT_OPTIONS)[number]["id"]
              }
              onChange={handleSortChange}
              options={SORT_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
            />
          </div>

          {initialCommunities.length > 0 ? (
            <>
              <CommunityList
                communities={initialCommunities}
                profileId={profileId}
                postCountsMap={postCountsMap}
              />
              <Pagination page={page} totalPages={totalPages} />
            </>
          ) : (
            <EmptyState
              icon={Users}
              bordered
              title={search ? `No communities match "${search}"` : "No communities here yet"}
              description="Start one and invite your friends."
              action={
                <Button asChild>
                  <Link href={`/communities/new${search ? `?name=${encodeURIComponent(search)}` : ""}`}>
                    <Plus />
                    Start a community
                  </Link>
                </Button>
              }
            />
          )}
        </div>
      )}

      {activeTab === "feed" && (
        <section aria-label="Posts from communities" className="space-y-4">
          {searchBox("Search posts", "Search community posts")}
          {initialPosts.length > 0 ? (
            <>
              <div className="space-y-3">
                {initialPosts.map((post) => (
                  <FeedCard key={post.id} post={post} currentUserId={profileId} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} />
            </>
          ) : (
            <EmptyState
              icon={MessageSquare}
              bordered
              title={search ? `No posts match "${search}"` : "No community posts yet"}
              description="Join a community and start the first conversation."
              action={<Button onClick={() => handleTabChange("explore")}>Find communities</Button>}
            />
          )}
        </section>
      )}

      {activeTab === "my_communities" && (
        <section aria-label="Communities you joined" className="space-y-4">
          {initialCommunities.length > 0 ? (
            <>
              <CommunityList
                communities={initialCommunities}
                profileId={profileId}
                postCountsMap={postCountsMap}
                joinedView
              />
              <Pagination page={page} totalPages={totalPages} />
            </>
          ) : (
            <EmptyState
              icon={Users}
              bordered
              title="You haven't joined any communities"
              description="Join a club or interest group to see its posts here."
              action={<Button onClick={() => handleTabChange("explore")}>Find communities</Button>}
            />
          )}
        </section>
      )}
    </main>
  );
}
