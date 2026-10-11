import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfileClientView } from "./profile-client";
import { getOwnProfilePageData } from "@/server/features/profile/profile.service";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id: targetId } = await searchParams;
  const result = await getOwnProfilePageData(targetId);

  if (result.kind === "redirect") {
    redirect(result.destination);
  }

  return (
    <Suspense
      fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading profile...</div>}
    >
      <ProfileClientView
        profile={result.profile}
        formattedPosts={result.formattedPosts}
        isOwnProfile={true}
        currentUserId={result.profile.id}
        followersCount={result.followCounts.followersCount}
        followingCount={result.followCounts.followingCount}
        friendsCount={result.followCounts.friendsCount}
      />
    </Suspense>
  );
}
