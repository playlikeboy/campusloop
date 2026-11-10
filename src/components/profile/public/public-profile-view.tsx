import type * as React from "react";
import { PublicFollowButton } from "@/components/profile/public-follow-button";
import { PublicShareButton } from "@/components/profile/public-share-button";
import { ProfileIdentity } from "@/components/profile/profile-identity";
import { isOfficialProfile, type ProfileView } from "@/components/profile/profile-view-model";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { type PublicPost, PublicActivity } from "./public-activity";
import { PublicJoinCard } from "./public-join-card";
import { PublicArticles, PublicStudyLibrary } from "./public-library";

interface PublicProfileViewProps {
  profile: ProfileView;
  posts: PublicPost[];
  articles: React.ComponentProps<typeof PublicArticles>["articles"];
  resources: React.ComponentProps<typeof PublicStudyLibrary>["resources"];
  playlists: React.ComponentProps<typeof PublicStudyLibrary>["playlists"];
  followersCount: number;
  followingCount: number;
  /** Structured data rendered at the top of the page. */
  jsonLd?: React.ReactNode;
}

/** /@username for visitors who are not logged in. */
export function PublicProfileView({
  profile,
  posts,
  articles,
  resources,
  playlists,
  followersCount,
  followingCount,
  jsonLd,
}: PublicProfileViewProps) {
  return (
    <MarketingShell>
      {jsonLd}
      <div className="mx-auto w-full max-w-5xl pb-16">
        <ProfileIdentity
          displayName={profile.displayName}
          username={profile.username}
          avatarUrl={profile.avatarUrl}
          bannerUrl={profile.bannerUrl}
          institution={profile.institution}
          course={profile.course}
          branch={profile.branch}
          year={profile.year}
          bio={profile.bio || profile.headline}
          socialLinks={profile.socialLinks}
          interests={profile.interests}
          isVerified={profile.isVerified}
          isOfficial={isOfficialProfile(profile)}
          actions={
            <>
              <PublicShareButton
                variant="icon"
                profile={{
                  username: profile.username,
                  displayName: profile.displayName,
                  avatarUrl: profile.avatarUrl,
                  institutionName: profile.institution?.name,
                  branch: profile.branch,
                  course: profile.course,
                  points: profile.points,
                }}
              />
              <PublicFollowButton username={profile.username} displayName={profile.displayName} profileId={profile.id} />
            </>
          }
          stats={[
            {
              label: posts.length === 1 ? "post" : "posts",
              // The page loads the latest 20 posts, so 20 means "20 or more".
              value: posts.length >= 20 ? "20+" : posts.length,
            },
            { label: "followers", value: followersCount, href: `/@${profile.username}/followers` },
            { label: "following", value: followingCount, href: `/@${profile.username}/following` },
          ]}
        />

        <div className="grid grid-cols-1 items-start gap-8 px-4 pt-6 sm:px-6 lg:grid-cols-12">
          <div className="min-w-0 space-y-8 lg:col-span-8">
            <PublicArticles articles={articles} />
            <PublicStudyLibrary resources={resources} playlists={playlists} />
            <PublicActivity posts={posts} username={profile.username} />
          </div>
          <aside className="lg:sticky lg:top-20 lg:col-span-4">
            <PublicJoinCard username={profile.username} />
          </aside>
        </div>
      </div>
    </MarketingShell>
  );
}
