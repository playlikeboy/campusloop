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

  const sort = stringParam(params.sort, "trending");
  const orderClause =
    sort === "newest"
      ? [desc(communities.createdAt)]
      : sort === "name"
      ? [communities.name]
      : [desc(communities.points), desc(communities.createdAt)];

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
      if (category === "Music & Arts") {
        communityFilters.push(
          or(eq(communities.category, "Music & Arts"), eq(communities.category, "Cultural & Arts"))
        );
      } else {
        communityFilters.push(eq(communities.category, category));
      }
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

  let myCommunityCount = 0;
  if (profile) {
    const [{ value: myTotal }] = await db
      .select({ value: count(communities.id) })
      .from(communities)
      .where(
        exists(
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
      );
    myCommunityCount = Number(myTotal || 0);
  }

  const totalCommunities = Number(communityTotal || 0);
  const totalCommunityPages = Math.max(1, Math.ceil(totalCommunities / COMMUNITY_PAGE_SIZE));
  const communityPage = Math.min(requestedPage, totalCommunityPages);

  const [communityRows, featuredRows, postCounts, categoryCountsRaw] = await Promise.all([
    db.query.communities.findMany({
      where: communityWhere,
      orderBy: orderClause,
      limit: COMMUNITY_PAGE_SIZE,
      offset: (communityPage - 1) * COMMUNITY_PAGE_SIZE,
      with: {
        members: {
          columns: { userId: true, status: true },
          with: {
            user: {
              columns: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
        creator: { columns: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    }),
    tab === "explore" && requestedPage === 1 && !q && category === "All"
      ? db.query.communities.findMany({
          where: ne(communities.privacy, "UNLISTED"),
          orderBy: [desc(communities.points), desc(communities.createdAt)],
          limit: 3,
          with: {
            members: {
              columns: { userId: true, status: true },
              with: {
                user: {
                  columns: { id: true, username: true, displayName: true, avatarUrl: true },
                },
              },
            },
            creator: { columns: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
        })
      : Promise.resolve([]),
    db
      .select({
        communityId: posts.communityId,
        count: count(posts.id),
      })
      .from(posts)
      .where(isNotNull(posts.communityId))
      .groupBy(posts.communityId),
    db
      .select({
        category: communities.category,
        count: count(communities.id),
      })
      .from(communities)
      .where(ne(communities.privacy, "UNLISTED"))
      .groupBy(communities.category),
  ]);

  const postCountsMap: Record<string, number> = {};
  for (const p of postCounts) {
    if (p.communityId) postCountsMap[p.communityId] = Number(p.count || 0);
  }

  const categoryCounts: Record<string, number> = { All: totalCommunities };
  for (const c of categoryCountsRaw) {
    if (c.category) {
      const key = c.category === "Cultural & Arts" ? "Music & Arts" : c.category;
      categoryCounts[key] = (categoryCounts[key] || 0) + Number(c.count || 0);
    }
  }

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
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://campusloop.space/communities#page",
        url: "https://campusloop.space/communities",
        name: "Student Communities, Campus Clubs & Technical Societies | CampusLoop",
        description:
          "Directory of student-created technical clubs, cultural societies, gaming clans, and campus sub-hubs across 1,350+ Indian colleges on CampusLoop.",
        publisher: {
          "@type": "Organization",
          name: "CampusLoop",
          url: "https://campusloop.space",
          logo: "https://campusloop.space/logo.png",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://campusloop.space",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Communities",
            item: "https://campusloop.space/communities",
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Campus Communities Directory",
        numberOfItems: communityRows.length,
        itemListElement: communityRows.slice(0, 12).map((comm, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: comm.name,
          url: `https://campusloop.space/communities/${comm.slug || comm.id}`,
          description: comm.description || undefined,
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CommunitiesIndexClient
        initialCommunities={communityRows as unknown as CommunityItem[]}
        featuredCommunities={featuredRows as unknown as CommunityItem[]}
        initialPosts={initialPosts}
        profileId={profile?.id || ""}
        page={tab === "feed" ? Math.min(requestedPage, feedTotalPages) : communityPage}
        totalPages={tab === "feed" ? feedTotalPages : totalCommunityPages}
        totalCount={tab === "feed" ? feedTotal : totalCommunities}
        myCommunityCount={myCommunityCount}
        categoryCounts={categoryCounts}
        postCountsMap={postCountsMap}
        currentSort={sort}
      />
    </>
  );
}
