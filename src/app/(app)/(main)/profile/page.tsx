import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { toProfileView } from "@/components/profile/profile-view-model";
import { ProfileSkeleton } from "@/components/ui/skeleton-card";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { getFollowCounts } from "@/lib/follows";
import { privateMetadata } from "@/lib/seo";
import { loadAuthorPosts, loadExternalPosts, toFeedPosts } from "./load-profile-posts";
import { ProfileClientView } from "./profile-client";

export const metadata = privateMetadata("Your profile");

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id: targetId } = await searchParams;

  const user = await hexclaveServerApp.getUser();
  if (!user) redirect("/sign-in");

  const db = getDb();

  if (targetId) {
    const target = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, targetId),
      columns: { username: true },
    });
    if (target) redirect(`/@${target.username}`);
  }

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
    with: { institution: true },
  });
  if (!profile) redirect("/onboarding");

  const rows = await loadAuthorPosts({ id: profile.id }, true);
  const [external, followCounts] = await Promise.all([
    loadExternalPosts(rows.map((p) => p.id)),
    getFollowCounts(profile.id),
  ]);

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileClientView
        profile={toProfileView(profile)}
        formattedPosts={toFeedPosts(rows, external, profile.id)}
        isOwnProfile
        currentUserId={profile.id}
        followersCount={followCounts.followersCount}
        followingCount={followCounts.followingCount}
        friendsCount={followCounts.friendsCount}
      />
    </Suspense>
  );
}
