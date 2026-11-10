import { and, desc, eq, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  loadAuthorPosts,
  loadExternalPosts,
  toFeedPosts,
} from "@/app/(app)/(main)/profile/load-profile-posts";
import { ProfileClientView } from "@/app/(app)/(main)/profile/profile-client";
import { toProfileView } from "@/components/profile/profile-view-model";
import { PublicProfileView } from "@/components/profile/public/public-profile-view";
import { Navigation } from "@/components/ui/navigation";
import { ProfileSkeleton } from "@/components/ui/skeleton-card";
import { getDb } from "@/db";
import { academicPlaylists, academicResources, articles, institutions, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { getFollowCounts, getFollowState } from "@/lib/follows";
import { getShowSeededPosts } from "@/lib/platform-config";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

interface VanityProfileProps {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{
    mode?: string;
    viewer?: string;
    view?: string;
    tab?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

function parseHandle(raw: string) {
  const decoded = decodeURIComponent(raw);
  return { hasAt: decoded.startsWith("@"), username: decoded.replace(/^@/, "") };
}

async function findProfile(username: string) {
  return getDb().query.userProfiles.findFirst({
    where: or(eq(userProfiles.username, username), sql`lower(${userProfiles.username}) = lower(${username})`),
    with: { institution: true },
  });
}

export async function generateMetadata({ params }: VanityProfileProps): Promise<Metadata> {
  const { hasAt, username } = parseHandle((await params).username);
  const [profile, showSeeded] = await Promise.all([findProfile(username), getShowSeededPosts()]);
  if (!profile || (!showSeeded && profile.isSeeded)) {
    // Streaming metadata would commit a 200 before notFound() ran here; the page body throws the real 404.
    return { title: "Profile not found", robots: { index: false, follow: false } };
  }
  if (!hasAt) redirect(`/@${username}`);

  const bio = (profile.bio || profile.headline || "").replace(/\s+/g, " ").trim();
  const college = profile.institution?.name;
  return buildMetadata({
    title: `${profile.displayName} (@${profile.username})`,
    description:
      bio.length >= 40
        ? bio.slice(0, 160)
        : `See posts, notes and articles by @${profile.username}${college ? ` from ${college}` : ""} on CampusLoop.`,
    path: `/@${profile.username}`,
    type: "profile",
    image: profile.avatarUrl ? { url: profile.avatarUrl, alt: profile.displayName } : undefined,
    // Profiles are personal pages: shareable, but kept out of search (robots.ts disallows /@).
    noindex: true,
  });
}

export default async function VanityProfilePage({ params, searchParams }: VanityProfileProps) {
  const { hasAt, username } = parseHandle((await params).username);
  const search = searchParams ? await searchParams : undefined;
  const isViewerMode =
    search?.mode === "viewer" ||
    search?.viewer === "true" ||
    search?.view === "viewer" ||
    search?.view === "public";

  const db = getDb();
  const [user, row, showSeeded] = await Promise.all([
    hexclaveServerApp.getUser(),
    findProfile(username),
    getShowSeededPosts(),
  ]);
  if (!row || (!showSeeded && row.isSeeded)) notFound();
  if (!hasAt) redirect(`/@${username}`);

  const viewer =
    user && !isViewerMode
      ? await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) })
      : null;
  if (user && !isViewerMode && !viewer) redirect("/onboarding");
  // The owner always lands on the editable /profile page.
  if (viewer && viewer.id === row.id) redirect("/profile");

  const profile = toProfileView(row);
  const postRows = await loadAuthorPosts(row, showSeeded);

  if (viewer) {
    const [external, college, followState] = await Promise.all([
      loadExternalPosts(postRows.map((p) => p.id)),
      viewer.institutionId
        ? db.query.institutions.findFirst({ where: eq(institutions.id, viewer.institutionId) })
        : Promise.resolve(null),
      getFollowState(row.id, viewer.id),
    ]);
    return (
      <div className="relative min-h-dvh bg-bg lg:flex">
        <Navigation
          profile={viewer}
          collegeName={college?.name ?? "Your college"}
          isAdmin={viewer.role === "ADMIN"}
        />
        <div className="mx-auto min-h-dvh w-full max-w-7xl min-w-0 flex-1 px-2 py-4 sm:px-6 sm:py-6 lg:px-8">
          <main className="w-full min-w-0 pb-24 md:pb-8">
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfileClientView
                profile={profile}
                formattedPosts={toFeedPosts(postRows, external, viewer.id)}
                isOwnProfile={false}
                currentUserId={viewer.id}
                followersCount={followState.followersCount}
                followingCount={followState.followingCount}
                friendsCount={followState.friendsCount}
                isFollowedByViewer={followState.isFollowedByViewer}
              />
            </Suspense>
          </main>
        </div>
      </div>
    );
  }

  const [external, counts, resources, playlists, published] = await Promise.all([
    loadExternalPosts(postRows.map((p) => p.id)),
    getFollowCounts(row.id),
    db.query.academicResources.findMany({
      where: eq(academicResources.uploaderId, row.id),
      orderBy: [desc(academicResources.createdAt)],
      limit: 6,
    }),
    db.query.academicPlaylists.findMany({
      where: eq(academicPlaylists.creatorId, row.id),
      orderBy: [desc(academicPlaylists.createdAt)],
      limit: 4,
    }),
    db.query.articles.findMany({
      where: and(eq(articles.authorId, row.id), eq(articles.status, "PUBLISHED")),
      orderBy: [desc(articles.publishedAt)],
      limit: 12,
    }),
  ]);

  const path = `/@${profile.username}`;
  const jsonLd = (
    <JsonLd
      data={[
        {
          "@type": "ProfilePage",
          "@id": absoluteUrl(path),
          url: absoluteUrl(path),
          dateCreated: row.createdAt.toISOString(),
          mainEntity: {
            "@type": "Person",
            name: profile.displayName,
            alternateName: `@${profile.username}`,
            identifier: profile.username,
            description: profile.bio || profile.headline || undefined,
            image: profile.avatarUrl || undefined,
            url: absoluteUrl(path),
            affiliation: profile.institution
              ? { "@type": "CollegeOrUniversity", name: profile.institution.name }
              : undefined,
          },
        },
        breadcrumbJsonLd([{ name: `@${profile.username}`, path }]),
      ]}
    />
  );

  return (
    <PublicProfileView
      profile={profile}
      jsonLd={jsonLd}
      posts={postRows.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        votes: p.votes,
        comments: p.comments,
        pollOptions: p.pollOptions,
        externalUrl: external.get(p.id)?.canonicalUrl ?? null,
      }))}
      articles={published}
      resources={resources}
      playlists={playlists}
      followersCount={counts.followersCount}
      followingCount={counts.followingCount}
    />
  );
}
