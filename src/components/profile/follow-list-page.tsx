import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowListClient } from "@/components/profile/follow-list-client";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Navigation } from "@/components/ui/navigation";
import { getDb } from "@/db";
import { institutions, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { type FollowDirection, getFollowCounts, getFollowListPage } from "@/lib/follows";

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
  return {
    title: `@${username}'s ${label} | CampusLoop`,
    description:
      direction === "followers"
        ? `Students following @${username} on CampusLoop.`
        : direction === "following"
          ? `Students @${username} follows on CampusLoop.`
          : `Students who are mutual campus friends with @${username} on CampusLoop.`,
    alternates: { canonical: `https://campusloop.space/@${username}/${direction}` },
    robots: { index: false, follow: true },
  };
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
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-xl">
          <BrandLogo href="/" size="sm" />
          <Link
            href="/join?mode=signup"
            className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-95 shadow-md transition-all"
          >
            Join Campus
          </Link>
        </header>
        <main className="mx-auto w-full max-w-4xl px-4 py-6">{list}</main>
      </div>
    );
  }

  const college = currentProfile.institutionId
    ? await db.query.institutions.findFirst({
        where: eq(institutions.id, currentProfile.institutionId),
      })
    : null;

  return (
    <div className="relative min-h-screen bg-background">
      <Navigation
        profile={currentProfile}
        collegeName={college?.name ?? "Your College"}
        isAdmin={currentProfile.role === "ADMIN"}
      />

      <div className="w-full max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6">
        <main className="w-full pb-24 md:pb-8">{list}</main>
      </div>
    </div>
  );
}
