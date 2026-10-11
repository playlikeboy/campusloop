import "server-only";

import { hexclaveServerApp } from "@/hexclave/server";
import type { ExternalPostInfo, FeedPost } from "@/hooks/use-feed";
import {
  findExternalPostsForPosts,
  findOwnProfileByUserId,
  findOwnProfilePosts,
  findProfileById,
  getProfileFollowCounts,
  findProfileByUsername,
  findProfileByUserId,
  findProfileInstitutionById,
  findPublicProfilePosts,
  findProfileAcademicResources,
  findProfileAcademicPlaylists,
} from "./profile.repository";
import { getFollowState } from "@/lib/follows";

type RedirectDestination = "/sign-in" | "/onboarding" | `/@${string}`;

export type OwnProfilePageResult =
  | { kind: "redirect"; destination: RedirectDestination }
  | {
      kind: "success";
      profile: NonNullable<Awaited<ReturnType<typeof findOwnProfileByUserId>>>;
      formattedPosts: FeedPost[];
      followCounts: Awaited<ReturnType<typeof getProfileFollowCounts>>;
    };

export async function getOwnProfilePageData(targetId?: string): Promise<OwnProfilePageResult> {
  const user = await hexclaveServerApp.getUser();
  if (!user) return { kind: "redirect", destination: "/sign-in" };

  if (targetId) {
    const targetProfile = await findProfileById(targetId);
    if (targetProfile) {
      return { kind: "redirect", destination: `/@${targetProfile.username}` };
    }
  }

  const currentProfile = await findOwnProfileByUserId(user.id);
  if (!currentProfile) return { kind: "redirect", destination: "/onboarding" };

  const userPosts = await findOwnProfilePosts(currentProfile.id);
  const externalPostsMap = new Map<string, ExternalPostInfo>();

  if (userPosts.length > 0) {
    try {
      const externalPostRows = await findExternalPostsForPosts(userPosts.map((post) => post.id));
      for (const externalPost of externalPostRows) {
        externalPostsMap.set(externalPost.postId, {
          id: externalPost.id,
          source: externalPost.source,
          externalId: externalPost.externalId,
          subreddit: externalPost.subreddit,
          externalAuthor: externalPost.externalAuthor,
          permalink: externalPost.permalink,
          canonicalUrl: externalPost.canonicalUrl,
          score: externalPost.score,
          commentCount: externalPost.commentCount,
          contentType: externalPost.contentType,
          media: externalPost.media.map((media) => ({
            id: media.id,
            mediaType: media.mediaType,
            mediaUrl: media.mediaUrl,
            previewUrl: media.previewUrl,
            thumbnailUrl: media.thumbnailUrl,
            hlsUrl: media.hlsUrl,
            dashUrl: media.dashUrl,
            width: media.width,
            height: media.height,
            duration: media.duration,
            isGif: media.isGif,
            position: media.position,
          })),
        });
      }
    } catch {
      // External media is optional; preserve the profile feed if its lookup fails.
    }
  }

  const formattedPosts = formatProfilePosts(userPosts, externalPostsMap, currentProfile.id);

  const followCounts = await getProfileFollowCounts(currentProfile.id);

  return {
    kind: "success",
    profile: currentProfile,
    formattedPosts: formattedPosts as FeedPost[],
    followCounts,
  };
}


export function getProfileForUsername(username: string) {
  return findProfileByUsername(username);
}

export async function getVanityProfileContext(username: string, loadViewerProfile: boolean) {
  const user = await hexclaveServerApp.getUser();
  const profile = await findProfileByUsername(username);

  if (!profile || profile.isSeeded) {
    return { user, profile: null, currentProfile: null };
  }

  const currentProfile = user && loadViewerProfile ? await findProfileByUserId(user.id) : null;
  return { user, profile, currentProfile };
}

export async function getPublicProfileActivity(profileId: string, userId: string) {
  const userPosts = await findPublicProfilePosts(profileId, userId);
  const externalPostsMap = new Map<string, ExternalPostInfo>();

  if (userPosts.length > 0) {
    try {
      const extPosts = await findExternalPostsForPosts(userPosts.map((post) => post.id));
      for (const post of extPosts) {
        externalPostsMap.set(post.postId, {
          id: post.id,
          source: post.source,
          externalId: post.externalId,
          subreddit: post.subreddit,
          externalAuthor: post.externalAuthor,
          permalink: post.permalink,
          canonicalUrl: post.canonicalUrl,
          score: post.score,
          commentCount: post.commentCount,
          contentType: post.contentType,
          media: post.media.map((media) => ({
            id: media.id,
            mediaType: media.mediaType,
            mediaUrl: media.mediaUrl,
            previewUrl: media.previewUrl,
            thumbnailUrl: media.thumbnailUrl,
            hlsUrl: media.hlsUrl,
            dashUrl: media.dashUrl,
            width: media.width,
            height: media.height,
            duration: media.duration,
            isGif: media.isGif,
            position: media.position,
          })),
        });
      }
    } catch {
      // Preserve public profile rendering when optional external media metadata is unavailable.
    }
  }

  return { userPosts, externalPostsMap };
}

export function formatProfilePosts(
  userPosts: Awaited<ReturnType<typeof findPublicProfilePosts>>,
  externalPostsMap: Map<string, ExternalPostInfo>,
  viewerProfileId: string,
): FeedPost[] {
  const formattedPosts = userPosts.map((post) => {
    const votesCount = post.votes.reduce((count, vote) => count + vote.value, 0);
    const commentsCount = post.comments.length;
    const userVote = post.votes.find((vote) => vote.userId === viewerProfileId)?.value || 0;
    const formattedPollOptions = post.pollOptions?.map((option) => {
      const votesCount = option.votes.length;
      const userVoted = option.votes.some((vote) => vote.userId === viewerProfileId);
      return { id: option.id, text: option.text, votesCount, userVoted };
    });
    const hasVotedPoll = formattedPollOptions?.some((option) => option.userVoted) || false;
    const totalPollVotes = formattedPollOptions?.reduce((count, option) => count + option.votesCount, 0) || 0;

    return {
      ...post,
      externalPost: externalPostsMap.get(post.id) || null,
      votesCount,
      commentsCount,
      userVote,
      pollOptions: formattedPollOptions,
      hasVotedPoll,
      totalPollVotes,
      votes: undefined,
      comments: undefined,
    };
  });

  return formattedPosts as FeedPost[];
}

export async function getInteractiveProfileHeaderData(
  institutionId: string | null,
  profileId: string,
  viewerId: string,
) {
  const [college, followState] = await Promise.all([
    institutionId ? findProfileInstitutionById(institutionId) : Promise.resolve(null),
    getFollowState(profileId, viewerId),
  ]);
  return { college, followState };
}

export async function getPublicProfileCardData(profileId: string) {
  const [publicFollowCounts, userAcademicResources, userPlaylists] = await Promise.all([
    getProfileFollowCounts(profileId),
    findProfileAcademicResources(profileId),
    findProfileAcademicPlaylists(profileId),
  ]);
  return { publicFollowCounts, userAcademicResources, userPlaylists };
}
