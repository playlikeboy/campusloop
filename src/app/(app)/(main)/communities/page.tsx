import { and, count, desc, eq, exists, ilike, isNotNull, ne, or } from "drizzle-orm";
import type { Metadata } from "next";
import {
  CommunitiesIndexClient,
  type CommunityItem,
} from "@/components/communities/communities-index-client";
import { getDb } from "@/db";
import { communityMembers, communities, posts } from "@/db/schema";
import type { FeedPost } from "@/hooks/use-feed";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Student Communities & Sub-Hubs",
  description:
    "Browse interest groups, technical societies, and student-created communities across 1,350+ Indian colleges on CampusLoop.",
  keywords: ["Student Communities", "College Sub-Hubs", "Campus Clubs", "Student Groups India", "Coding Clubs"],
  alternates: { canonical: "https://campusloop.space/communities" },
  openGraph: {
    title: "Student Communities & Sub-Hubs | CampusLoop",
    description: "Browse interest groups and student communities on CampusLoop.",
    url: "https://campusloop.space/communities",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://campusloop.space/og-communities.png", width: 1536, height: 1024, alt: "CampusLoop Communities & Clubs" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Communities, Clubs & Student Hubs | CampusLoop",
    description: "Explore student-run clubs, technical societies, and campus chapters across India.",
    images: ["https://campusloop.space/og-communities.png"],
  },
  robots: { index: true, follow: true },
};

const COMMUNITY_PAGE_SIZE = 12;
const FEED_PAGE_SIZE = 10;
const VALID_TABS = new Set(["explore", "feed", "my_communities"]);

function stringParam(value: string | string[] | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function pageParam(value: string) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawTab = stringParam(params.tab, "explore");
  const tab = VALID_TABS.has(rawTab) ? rawTab : "explore";
  const q = stringParam(params.q).trim();
  const category = stringParam(params.category, "All");
  const requestedPage = pageParam(stringParam(params.page, "1"));

  const user = await getCachedAuthUser();
  const db = getDb();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  const communityFilters = [];

  if (tab === "my_communities") {
    communityFilters.push(
      profile
        ? exists(
            db
              .select({ id: communityMembers.id })
              .from(communityMembers)
              .where(
                and(
                  eq(communityMembers.communityId, communities.id),
                  eq(communityMembers.userId, profile.id),
                  eq(communityMembers.status, "ACTIVE")
                )
              )
          )
        : eq(communities.id, "__no_guest_membership__")
    );
  } else {
    const activeMembership = profile
      ? exists(
          db
            .select({ id: communityMembers.id })
            .from(communityMembers)
            .where(
              and(
                eq(communityMembers.communityId, communities.id),
                eq(communityMembers.userId, profile.id),
                eq(communityMembers.status, "ACTIVE")
              )
            )
        )
      : undefined;

    communityFilters.push(
      activeMembership
        ? or(ne(communities.privacy, "UNLISTED"), activeMembership)
        : ne(communities.privacy, "UNLISTED")
    );

    if (tab === "explore" && category !== "All") {
      communityFilters.push(eq(communities.category, category));
    }

    if (tab !== "my_communities" && q) {
      const pattern = "%" + q + "%";
      communityFilters.push(or(ilike(communities.name, pattern), ilike(communities.description, pattern)));
    }
  }

  const communityWhere = and(...communityFilters);
  const [{ value: communityTotal }] = await db
    .select({ value: count(communities.id) })
    .from(communities)
    .where(communityWhere);

  const totalCommunities = Number(communityTotal || 0);
  const totalCommunityPages = Math.max(1, Math.ceil(totalCommunities / COMMUNITY_PAGE_SIZE));
  const communityPage = Math.min(requestedPage, totalCommunityPages);

  const communityRows = await db.query.communities.findMany({
    where: communityWhere,
    orderBy: [desc(communities.createdAt)],
    limit: COMMUNITY_PAGE_SIZE,
    offset: (communityPage - 1) * COMMUNITY_PAGE_SIZE,
    with: {
      members: { columns: { userId: true, status: true } },
      creator: { columns: { id: true, username: true, displayName: true } },
    },
  });

  let initialPosts: FeedPost[] = [];
  let feedTotalPages = 1;
  let feedTotal = 0;

  if (tab === "feed") {
    const feedFilters = [isNotNull(posts.communityId)];
    if (q) {
      const pattern = "%" + q + "%";
      feedFilters.push(or(ilike(posts.title, pattern), ilike(posts.body, pattern)) as never);
    }

    const feedWhere = and(...feedFilters);
    const [{ value: postTotal }] = await db.select({ value: count(posts.id) }).from(posts).where(feedWhere);
    feedTotal = Number(postTotal || 0);
    feedTotalPages = Math.max(1, Math.ceil(feedTotal / FEED_PAGE_SIZE));
    const feedPage = Math.min(requestedPage, feedTotalPages);

    const rawPosts = await db.query.posts.findMany({
      where: feedWhere,
      orderBy: [desc(posts.createdAt)],
      limit: FEED_PAGE_SIZE,
      offset: (feedPage - 1) * FEED_PAGE_SIZE,
      with: {
        author: true,
        institution: true,
        community: true,
        votes: true,
        comments: true,
        pollOptions: { with: { votes: true } },
      },
    });

    initialPosts = rawPosts.map((post) => {
      const votesCount = (post.votes || []).reduce((sum, vote) => sum + vote.value, 0);
      const commentsCount = (post.comments || []).length;
      const userVote = profile ? (post.votes || []).find((vote) => vote.userId === profile.id)?.value || 0 : 0;
      const pollOptions = post.pollOptions?.map((option) => {
        const votesCount = (option.votes || []).length;
        return {
          id: option.id,
          text: option.text,
          votesCount,
          userVoted: profile ? (option.votes || []).some((vote) => vote.userId === profile.id) : false,
        };
      });
      const hasVotedPoll = pollOptions?.some((option) => option.userVoted) || false;
      const totalPollVotes = pollOptions?.reduce((sum, option) => sum + option.votesCount, 0) || 0;

      return {
        ...post,
        votesCount,
        commentsCount,
        userVote,
        pollOptions,
        hasVotedPoll,
        totalPollVotes,
        votes: undefined,
        comments: undefined,
      } as unknown as FeedPost;
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Student Communities & Campus Sub-Hubs",
    url: "https://campusloop.space/communities",
    description:
      "Directory of student-created technical clubs, cultural societies, and special interest groups across Indian colleges.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CommunitiesIndexClient
        initialCommunities={communityRows as unknown as CommunityItem[]}
        initialPosts={initialPosts}
        profileId={profile?.id || ""}
        page={tab === "feed" ? Math.min(requestedPage, feedTotalPages) : communityPage}
        totalPages={tab === "feed" ? feedTotalPages : totalCommunityPages}
        totalCount={tab === "feed" ? feedTotal : totalCommunities}
      />
    </>
  );
}
