import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FollowListClient } from "@/components/profile/follow-list-client";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { Navigation } from "@/components/ui/navigation";
import { getDb } from "@/db";
import { institutions, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { type FollowDirection, getFollowCounts, getFollowListPage } from "@/lib/follows";
import { buildMetadata } from "@/lib/seo";

type Direction = FollowDirection;

/** Vanity routes carry the leading "@" in the segment; strip it or 404. */
function parseHandle(rawUsername: string): string | null {
  const decoded = decodeURIComponent(rawUsername);
  return decoded.startsWith("@") ? decoded.slice(1) : null;
}

export async function generateFollowListMetadata(
  rawUsername: string,
  direction: Direction
): Promise<Metadata> {
  const username = parseHandle(rawUsername);
  if (!username) return { title: "Profile" };

  const label = direction === "followers" ? "Followers" : direction === "following" ? "Following" : "Friends";
  return buildMetadata({
    title: `@${username} · ${label}`,
    description:
      direction === "followers"
        ? `People who follow @${username} on CampusLoop.`
        : direction === "following"
          ? `People @${username} follows on CampusLoop.`
          : `People who follow @${username} and are followed back, on CampusLoop.`,
    path: `/@${username}/${direction}`,
    noindex: true,
  });
}

export async function FollowListPageView({
  rawUsername,
  direction,
}: {
  rawUsername: string;
  direction: Direction;
}) {
  const username = parseHandle(rawUsername);
  if (!username) notFound();

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.username, username),
    columns: { id: true, username: true, displayName: true, status: true },
  });

  if (profile?.status !== "ACTIVE") notFound();

  const user = await hexclaveServerApp.getUser();
  const currentProfile = user
    ? await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) })
    : null;

  const [counts, initialPage] = await Promise.all([
    getFollowCounts(profile.id),
    getFollowListPage({
      profileId: profile.id,
      direction,
      viewerId: currentProfile?.id ?? null,
    }),
  ]);

  const list = (
    <FollowListClient
      username={profile.username}
      displayName={profile.displayName}
      direction={direction}
      initialPage={initialPage}
      followersCount={counts.followersCount}
      followingCount={counts.followingCount}
      friendsCount={counts.friendsCount}
      isSignedIn={Boolean(currentProfile)}
    />
  );

  if (!currentProfile) {
    return (
      <MarketingShell>
        <div className="mx-auto w-full max-w-2xl">{list}</div>
      </MarketingShell>
    );
  }

  const college = currentProfile.institutionId
    ? await db.query.institutions.findFirst({
        where: eq(institutions.id, currentProfile.institutionId),
      })
    : null;

  return (
    <div className="relative min-h-dvh bg-bg">
      <Navigation
        profile={currentProfile}
        collegeName={college?.name ?? "Your college"}
        isAdmin={currentProfile.role === "ADMIN"}
      />

      <div className="mx-auto w-full max-w-2xl px-2 py-4 sm:px-6 sm:py-6">
        <main className="w-full pb-24 md:pb-8">{list}</main>
      </div>
    </div>
  );
}
