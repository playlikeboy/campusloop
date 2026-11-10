import { desc, eq, ne } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CommunityDetailClient } from "@/components/communities/community-detail-client";
import { getDb } from "@/db";
import { communities, communityMembers, posts } from "@/db/schema";
import type { FeedPost } from "@/hooks/use-feed";
import { sanitizeAnonRow } from "@/lib/anonymity";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { getCachedAuthUser, getCachedCommunity, getCachedUserProfile } from "@/lib/server-cache";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const comm = await getCachedCommunity(id);

  // 404 here so the status is set before streaming starts.
  if (!comm) notFound();

  const path = `/communities/${comm.slug || comm.id}`;
  return buildMetadata({
    title: `c/${comm.name}`,
    description:
      comm.description?.slice(0, 160) ||
      `Posts, questions and events from the c/${comm.name} community on CampusLoop.`,
    path,
    image: comm.bannerUrl || undefined,
    noindex: comm.privacy !== "PUBLIC",
  });
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [user, comm] = await Promise.all([getCachedAuthUser(), getCachedCommunity(id)]);

  if (!comm) notFound();

  // If community is private or unlisted, require authentication
  if (comm.privacy !== "PUBLIC" && !user) {
    redirect("/sign-in");
  }

  const profile = user ? await getCachedUserProfile(user.id) : null;
  if (user && !profile) redirect("/onboarding");

  const userMembership = profile ? comm.members.find((m) => m.userId === profile.id) : null;
  const isMember = Boolean(userMembership && userMembership.status === "ACTIVE");
  const isAdmin = Boolean(profile && (comm.creatorId === profile.id || userMembership?.role === "ADMIN"));
  const activeMembersCount = comm.members.filter((m) => m.status === "ACTIVE").length;

  const db = getDb();

  // Parallelize community posts, full members list, and related communities
  const [communityPosts, allMembers, otherCommunities] = await Promise.all([
    db.query.posts.findMany({
      where: eq(posts.communityId, comm.id),
      orderBy: [desc(posts.createdAt)],
      limit: 50,
      with: {
        author: true,
        institution: true,
        community: true,
        votes: true,
        comments: true,
        pollOptions: {
          with: { votes: true },
        },
      },
    }),
    db.query.communityMembers.findMany({
      where: eq(communityMembers.communityId, comm.id),
      limit: 30,
      with: {
        user: true,
      },
    }),
    db.query.communities.findMany({
      where: ne(communities.id, comm.id),
      limit: 4,
      with: {
        members: true,
      },
    }),
  ]);

  const formattedPosts = communityPosts.map((post) => {
    const votesCount = post.votes.reduce((acc, vote) => acc + vote.value, 0);
    const commentsCount = post.comments.length;
    const userVote = profile ? post.votes.find((v) => v.userId === profile.id)?.value || 0 : 0;

    const formattedPollOptions = post.pollOptions?.map((opt) => {
      const optVotesCount = opt.votes.length;
      const userVoted = profile ? opt.votes.some((v) => v.userId === profile.id) : false;
      return { id: opt.id, text: opt.text, votesCount: optVotesCount, userVoted };
    });

    const hasVotedPoll = formattedPollOptions?.some((opt) => opt.userVoted) || false;
    const totalPollVotes = formattedPollOptions?.reduce((acc, opt) => acc + opt.votesCount, 0) || 0;

    return {
      ...sanitizeAnonRow(post),
      votesCount,
      commentsCount,
      userVote,
      pollOptions: formattedPollOptions,
      hasVotedPoll,
      totalPollVotes,
      votes: undefined,
      comments: undefined,
    } as unknown as FeedPost;
  });

  const membersList = allMembers
    .filter((m) => m.user)
    .map((m) => ({
      id: m.id,
      role: m.role,
      user: {
        id: m.user.id,
        username: m.user.username,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        headline: m.user.headline,
        points: m.user.points,
      },
    }));

  const relatedCommunities = otherCommunities.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    category: c.category,
    avatarUrl: c.avatarUrl,
    membersCount: c.members.length,
    isMember: profile ? c.members.some((m) => m.userId === profile.id) : false,
  }));

  const communityPath = `/communities/${comm.slug || comm.id}`;

  return (
    <>
      {comm.privacy === "PUBLIC" && (
        <JsonLd
          data={[
            {
              "@type": "DiscussionForum",
              name: `c/${comm.name}`,
              description: comm.description || undefined,
              url: absoluteUrl(communityPath),
              image: comm.bannerUrl || comm.avatarUrl || undefined,
            },
            breadcrumbJsonLd([
              { name: "Communities", path: "/communities" },
              { name: comm.name, path: communityPath },
            ]),
          ]}
        />
      )}

      <CommunityDetailClient
        community={{
          id: comm.id,
          name: comm.name,
          slug: comm.slug,
          description: comm.description,
          category: comm.category,
          privacy: comm.privacy,
          avatarUrl: comm.avatarUrl,
          bannerUrl: comm.bannerUrl,
          points: comm.points,
          rules: comm.rules,
          allowAnonymousPosts: comm.allowAnonymousPosts,
          creatorId: comm.creatorId,
          createdAt: comm.createdAt,
          creator: comm.creator,
        }}
        initialPosts={formattedPosts}
        initialMembersCount={activeMembersCount}
        initialIsMember={isMember}
        isAdmin={isAdmin}
        relatedCommunities={relatedCommunities}
        membersList={membersList}
      />
    </>
  );
}
