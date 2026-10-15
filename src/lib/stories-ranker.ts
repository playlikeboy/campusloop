import type { Story, UserProfile } from "@/db/schema";

export type StoryPayload = Pick<
  Story,
  "id" | "mediaUrl" | "text" | "backgroundColor" | "createdAt" | "expiresAt"
>;

export interface RankedStoryGroup {
  user: UserProfile;
  stories: StoryPayload[];
  isSelf: boolean;
  isFriend: boolean;
  isFollowing: boolean;
}

export interface RankStoriesInput {
  viewerProfileId: string;
  activeStories: Array<{
    id: string;
    userId: string;
    mediaUrl: string | null;
    text: string | null;
    backgroundColor: string | null;
    createdAt: Date;
    expiresAt: Date;
    user?: UserProfile | null;
  }>;
  followingIds: string[];
  friendIds: string[]; // Mutual follows
  /** Authors the viewer engages with most, strongest first (viewer-affinity). */
  engagedAuthorIds?: string[];
  /** Blocked in either direction; never shown. */
  blockedUserIds?: string[];
  now?: number;
}

/**
 * Closeness score for a followed author's story tray slot, in the spirit of
 * Instagram's story ordering (predicted interest, not pure recency):
 * mutual follow +2, engagement rank up to +3, freshness up to +1.
 */
export function storyClosenessScore(opts: {
  isFriend: boolean;
  engagedRank: number; // -1 if not engaged
  engagedCount: number;
  latestStoryAt: number;
  now: number;
}): number {
  const friend = opts.isFriend ? 2 : 0;
  const engaged =
    opts.engagedRank >= 0 && opts.engagedCount > 0 ? 3 * (1 - opts.engagedRank / opts.engagedCount) : 0;
  const ageHours = Math.max(0, (opts.now - opts.latestStoryAt) / 3_600_000);
  const freshness = Math.max(0, 1 - ageHours / 24);
  return friend + engaged + freshness;
}

/**
 * Filters stories to ONLY show:
 * 1. The viewer's own stories
 * 2. Stories from users the viewer is following
 *
 * And prioritizes the output:
 * - Priority 0: Viewer's own stories
 * - Priority 1: Mutual Friends (mutual follows), sorted by newest story
 * - Priority 2: General Followings, sorted by newest story
 */
export function rankAndFilterStories(input: RankStoriesInput): RankedStoryGroup[] {
  const { viewerProfileId, activeStories, followingIds, friendIds } = input;
  const now = input.now ?? Date.now();
  const engagedIds = input.engagedAuthorIds ?? [];
  const engagedRank = new Map(engagedIds.map((id, idx) => [id, idx]));
  const blockedSet = new Set(input.blockedUserIds ?? []);

  const followingSet = new Set(followingIds);
  const friendSet = new Set(friendIds);

  // Map to group stories by user
  const userMap = new Map<string, { user: UserProfile; stories: StoryPayload[] }>();

  for (const story of activeStories) {
    if (!story.user) continue;

    const isSelf = story.userId === viewerProfileId;
    const isFollowing = followingSet.has(story.userId);

    // Rule: ONLY show stories of self or followings, never blocked users
    if ((!isSelf && !isFollowing) || blockedSet.has(story.userId)) {
      continue;
    }

    if (!userMap.has(story.userId)) {
      userMap.set(story.userId, {
        user: story.user,
        stories: [],
      });
    }

    const entry = userMap.get(story.userId)!;
    entry.stories.push({
      id: story.id,
      mediaUrl: story.mediaUrl,
      text: story.text,
      backgroundColor: story.backgroundColor,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
    });
  }

  // Convert map to ranked list
  const groups: RankedStoryGroup[] = [];

  for (const [userId, entry] of userMap.entries()) {
    // Sort stories within user group chronologically (oldest to newest for viewing)
    entry.stories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const isSelf = userId === viewerProfileId;
    const isFriend = friendSet.has(userId);
    const isFollowing = followingSet.has(userId);

    groups.push({
      user: entry.user,
      stories: entry.stories,
      isSelf,
      isFriend,
      isFollowing,
    });
  }

  // Self first, then by closeness (mutual follow, engagement, freshness).
  // Unseen-before-seen is applied client-side, where seen state lives.
  const scoreOf = (g: RankedStoryGroup) =>
    storyClosenessScore({
      isFriend: g.isFriend,
      engagedRank: engagedRank.get(g.user.id) ?? -1,
      engagedCount: engagedIds.length,
      latestStoryAt: Math.max(...g.stories.map((s) => new Date(s.createdAt).getTime())),
      now,
    });
  const scores = new Map(groups.map((g) => [g, scoreOf(g)]));
  groups.sort((a, b) => {
    if (a.isSelf) return -1;
    if (b.isSelf) return 1;
    return (scores.get(b) ?? 0) - (scores.get(a) ?? 0);
  });

  return groups;
}
