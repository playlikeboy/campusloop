"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FeedPost } from "@/hooks/use-feed";
import type { InstitutionEmailFormat } from "@/lib/student-email-domains";
import { type CollegeAcademicResourceItem, CollegeAcademicsView } from "./college-academics-view";
import { CollegeClubsView } from "./college-clubs-view";
import { CollegeFeedPanel } from "./college-feed-panel";
import { type AllowedDomainItem, CollegeHeroHeader } from "./college-hero-header";
import { CollegeLeaderboardPodium } from "./college-leaderboard-podium";
import { CollegeRealityScorecard } from "./college-reality-scorecard";

interface StudentItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  points?: number | null;
  course?: string | null;
  branch?: string | null;
  year?: number | null;
  headline?: string | null;
}

interface NearbyCollege {
  id: string;
  name: string;
  slug: string;
  district?: string | null;
  state?: string | null;
  studentsCount: number;
}

interface CollegeHubClientProps {
  college: {
    id: string;
    slug: string;
    name: string;
    state?: string | null;
    district?: string | null;
    website?: string | null;
    websiteDomain?: string | null;
    yearOfEstablishment?: number | null;
    aisheCode?: string | null;
    locationType?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    nirfRank?: number | null;
    description?: string | null;
  };
  allowedDomains: AllowedDomainItem[];
  emailFormatInfo?: InstitutionEmailFormat | null;
  initialPosts: FeedPost[];
  academics?: CollegeAcademicResourceItem[];
  students: StudentItem[];
  relatedColleges: NearbyCollege[];
  currentUserId?: string;
  isEnrolledHere: boolean;
  isVerifiedCollege?: boolean;
  trendingTags: string[];
}

type TabType = "feed" | "academics" | "students" | "clubs" | "info";
const PAGE_SIZE = 20;

export function CollegeHubClient({
  college,
  allowedDomains,
  emailFormatInfo,
  initialPosts,
  academics = [],
  students,
  relatedColleges,
  currentUserId,
  isEnrolledHere,
  isVerifiedCollege = false,
  trendingTags,
}: CollegeHubClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("feed");

  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialPosts.length >= PAGE_SIZE);
  }, [initialPosts]);

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/feed?institutionId=${college.id}&page=${nextPage}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("Failed to fetch more posts");
      const newPosts = (await res.json()) as FeedPost[];
      if (newPosts.length < PAGE_SIZE) setHasMore(false);
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...newPosts.filter((p) => !existingIds.has(p.id))];
      });
      setPage(nextPage);
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, college.id]);

  const loadMorePostsRef = useRef(loadMorePosts);
  useEffect(() => {
    loadMorePostsRef.current = loadMorePosts;
  }, [loadMorePosts]);

  useEffect(() => {
    if (!sentinelNode || !hasMore || activeTab !== "feed") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) loadMorePostsRef.current();
      },
      { threshold: 0.2, rootMargin: "250px" }
    );
    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [sentinelNode, hasMore, isLoadingMore, activeTab]);

  function handleAskSenior() {
    router.push(`/post/new?tag=AskSeniors&college=${college.slug}`);
  }

  const shortName = college.name.split(",")[0];
  const nearby = relatedColleges.slice(0, 5);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 pt-3 pb-24">
      <CollegeHeroHeader
        college={college}
        allowedDomains={allowedDomains}
        studentCount={students.length}
        postsCount={posts.length}
        academicsCount={academics.length}
        isEnrolledHere={isEnrolledHere}
        isVerifiedCollege={isVerifiedCollege}
        isSignedIn={Boolean(currentUserId)}
        onAskSeniorClick={handleAskSenior}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="gap-4">
        <div className="sticky top-12 z-20 -mx-4 bg-bg px-4 lg:top-0">
          <TabsList
            variant="line"
            aria-label="College sections"
            className="no-scrollbar w-full overflow-x-auto"
          >
            <TabsTrigger value="feed">Posts</TabsTrigger>
            <TabsTrigger value="academics">Notes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="clubs">Clubs</TabsTrigger>
            <TabsTrigger value="info">About</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="feed">
          <CollegeFeedPanel
            posts={posts}
            collegeSlug={college.slug}
            shortName={shortName}
            trendingTags={trendingTags}
            currentUserId={currentUserId}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            sentinelRef={setSentinelNode}
          />
        </TabsContent>
        <TabsContent value="academics">
          <CollegeAcademicsView collegeName={college.name} collegeSlug={college.slug} resources={academics} />
        </TabsContent>
        <TabsContent value="students">
          <CollegeLeaderboardPodium students={students} collegeName={college.name} />
        </TabsContent>
        <TabsContent value="clubs">
          <CollegeClubsView collegeName={college.name} />
        </TabsContent>
        <TabsContent value="info">
          <CollegeRealityScorecard
            collegeName={college.name}
            collegeSlug={college.slug}
            allowedDomains={allowedDomains}
            studentCount={students.length}
            nirfRank={college.nirfRank}
            description={college.description}
            emailFormat={emailFormatInfo}
            onAskSeniorClick={currentUserId ? handleAskSenior : undefined}
          />
        </TabsContent>
      </Tabs>

      {!currentUserId && (
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-bold text-fg">Study at {shortName}?</h2>
            <p className="text-sm text-fg-muted">
              Join with your college email
              {allowedDomains[0] ? ` (@${allowedDomains[0].domain})` : ""} to post, vote and chat.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link
              href={`/sign-up?college=${college.slug}${allowedDomains[0] ? `&domain=${allowedDomains[0].domain}` : ""}`}
            >
              Join with college email
            </Link>
          </Button>
        </section>
      )}

      {nearby.length > 0 && (
        <nav aria-label={`More colleges in ${college.state ?? "this state"}`} className="space-y-2 pt-2">
          <h2 className="text-base font-bold text-fg">More colleges in {college.state}</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {nearby.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/college/${c.slug || c.id}`}
                  className="text-fg-muted underline-offset-4 transition-ui hover:text-fg hover:underline"
                >
                  {c.name.split(",")[0]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
