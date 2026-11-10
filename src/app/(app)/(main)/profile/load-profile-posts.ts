import { and, desc, eq, inArray, or } from "drizzle-orm";
import { getDb } from "@/db";
import { externalPosts, posts } from "@/db/schema";
import type { ExternalPostInfo, FeedPost } from "@/hooks/use-feed";

/** Media and Reddit mirror info for a set of posts. Failures return an empty map. */
export async function loadExternalPosts(postIds: string[]) {
  const map = new Map<string, ExternalPostInfo>();
  if (postIds.length === 0) return map;
  try {
    const rows = await getDb().query.externalPosts.findMany({
      where: inArray(externalPosts.postId, postIds),
      with: { media: { orderBy: (media, { asc }) => [asc(media.position)] } },
    });
    for (const ep of rows) {
      map.set(ep.postId, {
        id: ep.id,
        source: ep.source,
        externalId: ep.externalId,
        subreddit: ep.subreddit,
        externalAuthor: ep.externalAuthor,
        permalink: ep.permalink,
        canonicalUrl: ep.canonicalUrl,
        score: ep.score,
        commentCount: ep.commentCount,
        contentType: ep.contentType,
        media: ep.media.map((m) => ({
          id: m.id,
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl,
          previewUrl: m.previewUrl,
          thumbnailUrl: m.thumbnailUrl,
          hlsUrl: m.hlsUrl,
          dashUrl: m.dashUrl,
          width: m.width,
          height: m.height,
          duration: m.duration,
          isGif: m.isGif,
          position: m.position,
        })),
      });
    }
  } catch {
    // external_posts is optional; the profile still renders without it.
  }
  return map;
}

/** Raw published, named posts by a profile (anonymous posts never show on a profile). */
export async function loadAuthorPosts(
  profile: { id: string; userId?: string | null },
  includeSeeded: boolean
) {
  return getDb().query.posts.findMany({
    where: and(
      profile.userId
        ? or(eq(posts.authorId, profile.id), eq(posts.authorId, profile.userId))
        : eq(posts.authorId, profile.id),
      eq(posts.status, "PUBLISHED"),
      includeSeeded ? undefined : eq(posts.isSeeded, false),
      eq(posts.isAnonymous, false)
    ),
    orderBy: [desc(posts.createdAt)],
    limit: 20,
    with: {
      author: true,
      institution: true,
      votes: true,
      comments: true,
      pollOptions: { with: { votes: true } },
    },
  });
}

export type AuthorPost = Awaited<ReturnType<typeof loadAuthorPosts>>[number];

/** Shapes posts for FeedCard, from the point of view of `viewerId`. */
export function toFeedPosts(
  rows: AuthorPost[],
  external: Map<string, ExternalPostInfo>,
  viewerId: string
): FeedPost[] {
  return rows.map((post) => {
    const pollOptions = post.pollOptions?.map((opt) => ({
      id: opt.id,
      text: opt.text,
      votesCount: opt.votes.length,
      userVoted: opt.votes.some((v) => v.userId === viewerId),
    }));
    return {
      ...post,
      externalPost: external.get(post.id) || null,
      votesCount: post.votes.reduce((acc, vote) => acc + vote.value, 0),
      commentsCount: post.comments.length,
      userVote: post.votes.find((v) => v.userId === viewerId)?.value || 0,
      pollOptions,
      hasVotedPoll: pollOptions?.some((opt) => opt.userVoted) || false,
      totalPollVotes: pollOptions?.reduce((acc, opt) => acc + opt.votesCount, 0) || 0,
      votes: undefined,
      comments: undefined,
    };
  }) as unknown as FeedPost[];
}
