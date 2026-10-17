import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart2,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  FolderPlus,
  GraduationCap,
  Lock,
  MessageSquare,
  School,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfileClientView } from "@/app/(app)/(main)/profile/profile-client";
import { ShareQrButton } from "@/components/common/share-qr-button";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import { PublicFollowButton } from "@/components/profile/public-follow-button";
import { PublicShareButton } from "@/components/profile/public-share-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navigation } from "@/components/ui/navigation";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { getBranchIcon } from "@/constants";
import { getDb } from "@/db";
import { getCloutTier } from "@/lib/gamification";
import {
  academicPlaylists,
  academicResources,
  articles,
  externalPosts,
  institutions,
  posts,
  userProfiles,
} from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import type { ExternalPostInfo, FeedPost } from "@/hooks/use-feed";
import { getFollowCounts, getFollowState } from "@/lib/follows";
import { extractMediaAttachments } from "@/lib/media-attachments";
import { getShowSeededPosts } from "@/lib/platform-config";

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

export async function generateMetadata({ params }: VanityProfileProps): Promise<Metadata> {
  const resolved = await params;
  const rawUsername = decodeURIComponent(resolved.username);

  // Redirect and 404 are decided here, not in the page: metadata resolves before
  // streaming starts, so this is the last point a real status code can be sent.
  if (!rawUsername.startsWith("@")) redirect(`/@${rawUsername}`);
  const username = rawUsername.slice(1);
  const db = getDb();
  const [profile, showSeeded] = await Promise.all([
    db.query.userProfiles.findFirst({
      where: or(
        eq(userProfiles.username, username),
        sql`lower(${userProfiles.username}) = lower(${username})`
      ),
      with: { institution: true },
    }),
    getShowSeededPosts(),
  ]);
  if (!profile || (!showSeeded && profile.isSeeded)) notFound();

  const title = profile ? `${profile.displayName} (@${username})` : `@${username}`;
  const description = profile?.bio
    ? profile.bio
    : `View @${username}'s student clout rank, points, and campus activity on CampusLoop.`;
  const url = `https://campusloop.space/@${username}`;

  return {
    title,
    description,
    keywords: [
      `@${username}`,
      profile?.displayName || username,
      profile?.institution?.name || "CampusLoop Student",
      "student profile",
      "campus clout",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "CampusLoop",
      locale: "en_IN",
      type: "profile",
      images: profile?.avatarUrl
        ? [{ url: profile.avatarUrl, alt: profile.displayName }]
        : [{ url: "https://campusloop.space/og-image.png", alt: title, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: profile?.avatarUrl ? [profile.avatarUrl] : ["https://campusloop.space/og-image.png"],
    },
  };
}

export default async function VanityProfilePage({ params, searchParams }: VanityProfileProps) {
  const resolved = await params;
  const rawUsername = decodeURIComponent(resolved.username);

  // If URL parameter does not start with @, redirect cleanly to @username
  if (!rawUsername.startsWith("@")) {
    redirect(`/@${rawUsername}`);
  }

  const username = rawUsername.slice(1);
  const search = searchParams ? await searchParams : undefined;
  const isViewerMode =
    search?.mode === "viewer" ||
    search?.viewer === "true" ||
    search?.view === "viewer" ||
    search?.view === "public";

  const user = await hexclaveServerApp.getUser();
  const db = getDb();

  // Look up profile by username (case-insensitive fallback)
  const profile = await db.query.userProfiles.findFirst({
    where: or(
      eq(userProfiles.username, username),
      sql`lower(${userProfiles.username}) = lower(${username})`
    ),
    with: {
      institution: true,
    },
  });

  const showSeeded = await getShowSeededPosts();

  if (!profile || (!showSeeded && profile.isSeeded)) {
    notFound();
  }

  // Route an authenticated owner to the canonical interactive profile before loading public activity.
  // This prevents the vanity URL from rendering the public profile shell for its signed-in owner.
  if (user && !isViewerMode) {
    const viewerProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!viewerProfile) {
      redirect("/onboarding");
    }

    if (viewerProfile.id === profile.id) {
      redirect("/profile");
    }
  }

  // Fetch posts written by this user (never expose anonymous posts on public profile)
  const userPosts = await db.query.posts.findMany({
    where: and(
      or(eq(posts.authorId, profile.id), eq(posts.authorId, profile.userId)),
      eq(posts.status, "PUBLISHED"),
      showSeeded ? undefined : eq(posts.isSeeded, false),
      eq(posts.isAnonymous, false)
    ),
    orderBy: [desc(posts.createdAt)],
    limit: 20,
    with: {
      author: true,
      institution: true,
      votes: true,
      comments: true,
      pollOptions: {
        with: { votes: true },
      },
    },
  });

  // Hydrate external posts info (media, reddit syndication)
  const postIds = userPosts.map((p) => p.id);
  const externalPostsMap = new Map<string, ExternalPostInfo>();
  if (postIds.length > 0) {
    try {
      const extPosts = await db.query.externalPosts.findMany({
        where: inArray(externalPosts.postId, postIds),
        with: {
          media: {
            orderBy: (media, { asc }) => [asc(media.position)],
          },
        },
      });
      for (const ep of extPosts) {
        externalPostsMap.set(ep.postId, {
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
      // Graceful fallback if external_posts query fails
    }
  }

  // If user is authenticated and not explicitly in viewer mode, render with interactive sidebar layout
  if (user && !isViewerMode) {
    const currentProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (currentProfile) {
      const isOwnProfile = profile.id === currentProfile.id;

      // Format posts to match FeedPost type required by FeedCard
      const formattedPosts = userPosts.map((post) => {
        const votesCount = post.votes.reduce((acc, vote) => acc + vote.value, 0);
        const commentsCount = post.comments.length;
        const userVote = post.votes.find((v) => v.userId === currentProfile.id)?.value || 0;

        const formattedPollOptions = post.pollOptions?.map((opt) => {
          const optVotesCount = opt.votes.length;
          const userVoted = opt.votes.some((v) => v.userId === currentProfile.id);
          return { id: opt.id, text: opt.text, votesCount: optVotesCount, userVoted };
        });

        const hasVotedPoll = formattedPollOptions?.some((opt) => opt.userVoted) || false;
        const totalPollVotes = formattedPollOptions?.reduce((acc, opt) => acc + opt.votesCount, 0) || 0;

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

      const [college, followState] = await Promise.all([
        currentProfile.institutionId
          ? db.query.institutions.findFirst({ where: eq(institutions.id, currentProfile.institutionId) })
          : Promise.resolve(null),
        getFollowState(profile.id, currentProfile.id),
      ]);

      return (
        <div className="relative min-h-screen bg-background lg:flex">
          <Navigation
            profile={currentProfile}
            collegeName={college?.name ?? "Your College"}
            isAdmin={currentProfile.role === "ADMIN"}
          />

          <div className="min-h-screen min-w-0 flex-1 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6">
            <main className="w-full min-w-0 pb-24 md:pb-8">
              <Suspense
                fallback={
                  <div className="p-8 text-center text-xs text-muted-foreground">Loading profile...</div>
                }
              >
                <ProfileClientView
                  profile={profile}
                  formattedPosts={formattedPosts as FeedPost[]}
                  isOwnProfile={isOwnProfile}
                  currentUserId={currentProfile.id}
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
  }

  // If not authenticated, render LinkedIn-style public card
  const [publicFollowCounts, userAcademicResources, userPlaylists, userArticles] = await Promise.all([
    getFollowCounts(profile.id),
    db.query.academicResources.findMany({
      where: eq(academicResources.uploaderId, profile.id),
      orderBy: [desc(academicResources.createdAt)],
      limit: 6,
      with: {
        institution: true,
      },
    }),
    db.query.academicPlaylists.findMany({
      where: eq(academicPlaylists.creatorId, profile.id),
      orderBy: [desc(academicPlaylists.createdAt)],
      limit: 4,
    }),
    db.query.articles.findMany({
      where: and(
        eq(articles.authorId, profile.id),
        eq(articles.status, "PUBLISHED")
      ),
      orderBy: [desc(articles.publishedAt)],
      limit: 12,
    }),
  ]);
  const branchIcon = getBranchIcon(profile.branch || profile.course);
  const institutionName = profile.institution?.name || "Indian Institute of Technology";
  const campusShort = institutionName.split(",")[0];
  const points = profile.points || 0;
  const cloutTier = getCloutTier(points);
  const isOfficialDesk = profile.username.startsWith("loop_") || profile.role === "ADMIN";
  const isVerified = isOfficialDesk || profile.role === "ADMIN" || profile.role === "MODERATOR" || points >= 50;

  const cleanPostText = (body: string) =>
    body
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/https?:\/\/\S+/g, (url) => {
        try {
          return new URL(url.replace(/[),.]+$/, "")).hostname.replace(/^www\./, "");
        } catch {
          return "external link";
        }
      })
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateCreated: profile.createdAt.toISOString(),
    mainEntity: {
      "@type": "Person",
      name: profile.displayName,
      alternateName: `@${profile.username}`,
      identifier: profile.username,
      description: profile.bio || profile.headline || undefined,
      image: profile.avatarUrl || undefined,
      url: `https://campusloop.space/@${profile.username}`,
      alumniOf: institutionName
        ? {
            "@type": "EducationalOrganization",
            name: institutionName,
          }
        : undefined,
      knowsAbout: profile.branch ? [profile.branch, "College Academics"] : undefined,
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground relative overflow-x-hidden pb-16 select-none">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Top Floating Glass Header */}
      <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-4 sm:px-6 lg:px-8 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-black shadow-md">
              <img src="/logo.png" alt="CampusLoop Logo" className="h-full w-full object-cover scale-110" />
            </div>
            <span className="text-base font-black tracking-tight text-foreground">CampusLoop</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/join?mode=signin">
              <button className="rounded-full border border-border/80 px-4 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all cursor-pointer">
                Sign In
              </button>
            </Link>
            <Link href="/join?mode=signup">
              <button className="rounded-full bg-foreground text-background px-4 py-1.5 text-xs font-bold hover:bg-foreground/90 transition-all cursor-pointer">
                Join Campus
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="w-full pt-16 pb-16">
        {/* Full-Bleed Panoramic Cover Banner */}
        <div className="relative h-44 sm:h-60 lg:h-72 w-full max-w-5xl lg:max-w-6xl mx-auto bg-[#16181C] overflow-hidden rounded-b-2xl sm:rounded-b-3xl shadow-sm">
          {profile.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt={`${profile.displayName}'s banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-b from-neutral-800/60 via-[#16181C] to-[#121417] relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>
          )}

          {/* Ambient protection gradient */}
          <div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-black/35 pointer-events-none" />

          {/* Floating Campus Badge in Banner (Bottom Right) */}
          {campusShort && (
            <div className="absolute bottom-3 right-4 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-white/90 text-xs font-semibold shadow-md pointer-events-none">
              <School className="size-3.5 text-[#1D9BF0]" />
              <span>{campusShort}</span>
            </div>
          )}

          {/* Floating Banner Actions (Top Right) */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <PublicShareButton
              profile={{
                username: profile.username,
                displayName: profile.displayName,
                avatarUrl: profile.avatarUrl,
                institutionName: institutionName,
                branch: profile.branch,
                course: profile.course,
                points: points,
              }}
              className="rounded-full bg-black/40 text-white border-white/10 backdrop-blur-md hover:bg-black/60 shadow-md"
            />
            <ShareQrButton
              title={profile.displayName}
              subtitle={`@${profile.username} • ${profile.institution?.name || "Verified Student"}`}
              badgeText="Verified Student Network"
              shortUrl={`https://campusloop.space/@${profile.username}`}
              avatarUrl={profile.avatarUrl}
              category="profile"
              variant="icon"
              className="rounded-full bg-black/40 text-white border-white/10 backdrop-blur-md hover:bg-black/60 shadow-md"
            />
          </div>
        </div>

        {/* Profile Header Main Info (Clean Social Identity Architecture) */}
        <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6">
          {/* Avatar & Action Buttons Bar */}
          <div className="flex items-end justify-between -mt-14 sm:-mt-20 lg:-mt-24 mb-3 relative z-10">
            <div className="relative group">
              <Avatar className="size-28 sm:size-36 lg:size-40 rounded-full ring-4 ring-background shadow-2xl border-2 border-primary/25 bg-background">
                <AvatarImage src={profile.avatarUrl || ""} className="rounded-full object-cover" />
                <AvatarFallback className="text-3xl sm:text-4xl font-black bg-muted text-foreground rounded-full">
                  {profile.displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isVerified && (
                <span
                  className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 size-7 sm:size-8 rounded-full bg-background flex items-center justify-center shadow-xs border border-border/40"
                  title="Verified Campus Student"
                >
                  <VerifiedBadge size="md" />
                </span>
              )}
            </div>

            {/* Top Right Action Button */}
            <div className="flex items-center gap-2 pb-1 sm:pb-2">
              <PublicShareButton
                profile={{
                  username: profile.username,
                  displayName: profile.displayName,
                  avatarUrl: profile.avatarUrl,
                  institutionName: institutionName,
                  branch: profile.branch,
                  course: profile.course,
                  points: points,
                }}
                className="h-9 px-3.5 rounded-full"
              />
              <PublicFollowButton
                username={profile.username}
                displayName={profile.displayName}
                profileId={profile.id}
                isSignedIn={false}
              />
            </div>
          </div>

          {/* Full-Width Identity Section with Intentional Hierarchy */}
          <div className="space-y-2.5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground font-[family-name:var(--font-heading)]">
                  {profile.displayName}
                </h1>
                {isVerified && <VerifiedBadge size="md" />}
                {isOfficialDesk && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wide border border-primary/20">
                    <ShieldCheck className="size-3" /> Official CampusLoop Desk
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-medium text-muted-foreground mt-0.5">
                @{profile.username}
              </p>
            </div>

            {/* Academic Credentials & Campus Row */}
            <div className="space-y-1 text-xs sm:text-sm">
              {(profile.course || profile.branch) && (
                <div className="flex items-center gap-2 font-semibold text-foreground/90">
                  <GraduationCap className="size-4 text-primary shrink-0" />
                  <span>
                    {profile.course ? `${profile.course} ` : "B.Tech "}
                    {profile.branch || ""}
                    {profile.year ? ` · Year ${profile.year}` : ""}
                  </span>
                </div>
              )}

              {institutionName && (
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <School className="size-4 text-muted-foreground/80 shrink-0" />
                  <span>{institutionName}</span>
                </div>
              )}

              {profile.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Calendar className="size-3.5 text-muted-foreground/80 shrink-0" />
                  <span>
                    Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            {/* Bio as Personality Layer */}
            {profile.bio || profile.headline ? (
              <div className="max-w-3xl pt-1">
                <p className="text-sm sm:text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {profile.bio || profile.headline}
                </p>
              </div>
            ) : null}

            {/* Compact Social Identity Bar */}
            <ProfileSocialLinks links={profile.socialLinks as any} />

            {/* Borderless Reputation Strip */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-2.5 border-y border-border/40 my-2 text-xs">
              {/* Followers */}
              <Link href={`/@${profile.username}/followers`} className="hover:opacity-80 transition-opacity">
                <div className="text-left leading-tight">
                  <span className="font-bold text-foreground text-xs sm:text-sm block">{publicFollowCounts.followersCount}</span>
                  <span className="text-[10px] text-muted-foreground">Followers</span>
                </div>
              </Link>

              {/* Following */}
              <Link href={`/@${profile.username}/following`} className="hover:opacity-80 transition-opacity">
                <div className="text-left leading-tight">
                  <span className="font-bold text-foreground text-xs sm:text-sm block">{publicFollowCounts.followingCount}</span>
                  <span className="text-[10px] text-muted-foreground">Following</span>
                </div>
              </Link>

              {/* Articles Published */}
              {userArticles.length > 0 && (
                <div className="text-left leading-tight">
                  <span className="font-bold text-foreground text-xs sm:text-sm block">
                    {userArticles.length}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Articles</span>
                </div>
              )}

              {/* Academic Notes Shared */}
              {userAcademicResources.length > 0 && (
                <div className="text-left leading-tight">
                  <span className="font-bold text-foreground text-xs sm:text-sm block">
                    {userAcademicResources.length}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Notes & PYQs</span>
                </div>
              )}

              {/* Contributions */}
              <div className="flex items-center gap-2 ml-auto text-muted-foreground text-[11px] font-medium hidden sm:flex">
                {userArticles.length > 0 && (
                  <>
                    <span>{userArticles.length} Articles</span>
                    <span>·</span>
                  </>
                )}
                <span>{userPosts.length} Posts</span>
                <span>·</span>
                <span>{userAcademicResources.length + userPlaylists.length} Study Items</span>
              </div>
            </div>

            {/* Clean Interests Chips */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary/60 hover:bg-secondary text-secondary-foreground text-[11px] font-semibold transition-colors"
                  >
                    #{interest.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Content Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          {/* Main Column (Articles, Study Library & Recent Activity) */}
          <main className="lg:col-span-8 space-y-6 min-w-0">
            {/* Published Articles & Editorial Guides Section */}
            {userArticles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="size-4 text-primary" /> Published Articles &amp; Editorial ({userArticles.length})
                  </h3>
                  <Link
                    href="/articles"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>CampusLoop Articles</span>
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {userArticles.map((art) => (
                    <Link
                      key={art.id}
                      href={`/articles/${art.slug}`}
                      className="p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-muted/40 hover:border-border/60 transition-all flex flex-col justify-between gap-2.5 group shadow-2xs"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {art.category.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {art.readingTimeMinutes || 3} min read
                          </span>
                          {art.viewsCount > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              · {art.viewsCount} reads
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {art.title}
                        </h4>
                        {art.excerpt && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {art.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/20">
                        <span>
                          {art.publishedAt
                            ? new Date(art.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "Published"}
                        </span>
                        <span className="font-semibold text-primary flex items-center gap-1">
                          Read Guide <ArrowUpRight className="size-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* Study Library Section */}
            {(userAcademicResources.length > 0 || userPlaylists.length > 0) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FolderPlus className="size-4 text-[#1D9BF0]" /> Study Library (
                    {userAcademicResources.length + userPlaylists.length})
                  </h3>
                  <Link
                    href={`/@${profile.username}?tab=academics`}
                    className="text-xs font-bold text-[#1D9BF0] hover:underline flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>

                {/* Study Playlists if any */}
                {userPlaylists.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Curated Stacks &amp; Playlists
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {userPlaylists.map((pl) => (
                        <Link
                          key={pl.id}
                          href={`/academics/study-material/playlists/${pl.slug}`}
                          className="p-3.5 rounded-2xl border border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-border/60 transition-all flex flex-col justify-between gap-2.5 group shadow-2xs"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1D9BF0]/10 text-[#1D9BF0]">
                              {pl.category.replace("_", " ")}
                            </span>
                            <h4 className="text-xs font-bold text-foreground line-clamp-1 mt-1 group-hover:text-[#1D9BF0] transition-colors">
                              {pl.title}
                            </h4>
                            {pl.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                {pl.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/30">
                            <span className="font-semibold">{pl.itemsCount} materials</span>
                            <span>★ {pl.starsCount}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uploaded Resources */}
                {userAcademicResources.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Uploaded Notes &amp; PYQs
                    </span>
                    <div className="divide-y divide-border/20 rounded-2xl border border-border/40 bg-card/40 overflow-hidden shadow-2xs">
                      {userAcademicResources.map((res) => (
                        <Link
                          key={res.id}
                          href={`/academics/study-material/${res.id}`}
                          className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors gap-3"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <span className="font-mono font-bold text-foreground/90 bg-muted/40 px-1.5 py-0.5 rounded">
                                {res.subjectCode}
                              </span>
                              <span>·</span>
                              <span className="uppercase font-bold text-[#1D9BF0]">{res.resourceType}</span>
                              <span>·</span>
                              <span>Sem {res.semester}</span>
                            </div>
                            <h4 className="text-xs font-bold text-foreground line-clamp-1 hover:text-[#1D9BF0] transition-colors">
                              {res.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0 font-medium">
                            <span className="flex items-center gap-1">
                              <Download className="size-3.5" />
                              <span>{res.downloadsCount}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="size-3.5" />
                              <span>{res.upvotesCount}</span>
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Campus Activity Timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="size-4 text-[#1D9BF0]" /> Recent Activity
                  </h3>
                </div>
                {userPosts.length > 0 && (
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {userPosts.length} {userPosts.length === 1 ? "post" : "posts"}
                  </span>
                )}
              </div>

              {userPosts.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-border/40 bg-muted/10 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">No public posts yet</p>
                  <p className="text-[11px] text-muted-foreground">
                    Posts published by @{profile.username} will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/20 rounded-2xl border border-border/40 bg-card/30 overflow-hidden shadow-2xs">
                  {userPosts.slice(0, 10).map((p) => {
                    const votesTotal = p.votes.reduce((acc, v) => acc + v.value, 0);
                    const ep = externalPostsMap.get(p.id);
                    const parsedMedia = extractMediaAttachments(p.body || "");
                    const cleanText = parsedMedia.text;
                    const imageMedia = parsedMedia.attachments.find((a) => a.type === "image");
                    const docMedia = parsedMedia.attachments.find((a) => a.type === "document");

                    return (
                      <Link
                        key={p.id}
                        href={`/post/${p.id}`}
                        className="block p-4 hover:bg-muted/30 transition-colors space-y-2 group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {ep?.source && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                              {ep.source}
                            </span>
                          )}
                          {ep?.subreddit && (
                            <span className="text-[10px] font-semibold text-orange-400">r/{ep.subreddit}</span>
                          )}
                          {p.title && (
                            <h4 className="text-sm font-bold text-foreground line-clamp-1 min-w-0 group-hover:text-[#1D9BF0] transition-colors">
                              {cleanPostText(p.title)}
                            </h4>
                          )}
                        </div>

                        {imageMedia ? (
                          <div className="relative aspect-video max-h-56 w-full overflow-hidden rounded-xl bg-muted/40">
                            <img
                              src={imageMedia.url}
                              alt="Post media"
                              className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300"
                            />
                          </div>
                        ) : docMedia ? (
                          <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-muted/20 px-3 py-2 text-xs">
                            <FileText className="size-4 text-[#1D9BF0] shrink-0" />
                            <span className="truncate font-semibold text-foreground">
                              {docMedia.label || "Attached Document"}
                            </span>
                          </div>
                        ) : null}

                        {ep?.canonicalUrl ? (
                          <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-muted/20 px-2.5 py-2">
                            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate text-[11px] font-medium text-muted-foreground">
                              {(() => {
                                try {
                                  return new URL(ep.canonicalUrl).hostname.replace(/^www\./, "");
                                } catch {
                                  return "External source";
                                }
                              })()}
                            </span>
                          </div>
                        ) : cleanText ? (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {cleanText}
                          </p>
                        ) : null}

                        {p.pollOptions && p.pollOptions.length > 0 && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#1D9BF0] font-semibold">
                            <BarChart2 className="size-3" />
                            <span>Poll · {p.pollOptions.length} choices</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 font-medium">
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <ThumbsUp className="size-3" />
                            <span>
                              {votesTotal} {votesTotal === 1 ? "upvote" : "upvotes"}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="size-3" />
                            <span>
                              {p.comments.length} {p.comments.length === 1 ? "comment" : "comments"}
                            </span>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* Sticky Sidebar (Credibility & Connect CTA) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overscroll-contain no-scrollbar pr-1 pb-16">
            {/* Campus Standing Card */}
            <div className="rounded-2xl border border-border/40 bg-card/50 p-4.5 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="size-4 text-[#1D9BF0]" />
                <span>Campus Standing</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center select-none">
                <div className="p-3 rounded-xl border border-border/30 bg-muted/20">
                  <p className="text-xl font-black text-foreground">{userAcademicResources.length + userPlaylists.length}</p>
                  <p className="text-[10px] font-medium text-muted-foreground">Study Materials</p>
                </div>
                <div className="p-3 rounded-xl border border-border/30 bg-muted/20">
                  <p className="text-xl font-black text-foreground">{userPosts.length}</p>
                  <p className="text-[10px] font-medium text-muted-foreground">Campus Posts</p>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <BadgeCheck className="size-3.5 text-[#1D9BF0] shrink-0" />
                <span>Verified Student Network Member</span>
              </div>
            </div>

            {/* Connect CTA Card */}
            <div className="rounded-2xl border border-border/40 bg-card/60 p-5 text-center space-y-3.5 shadow-2xs">
              <div className="size-10 bg-[#1D9BF0]/10 text-[#1D9BF0] rounded-full flex items-center justify-center mx-auto">
                <Lock className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Connect with @{profile.username}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  Verify your college email to swipe matches, send private messages, and join your campus feed.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-1">
                <Link href="/join?mode=signin" className="flex-1">
                  <button className="w-full rounded-full border border-border/80 h-9 px-4 text-xs font-bold hover:bg-muted text-foreground transition-all cursor-pointer">
                    Sign In
                  </button>
                </Link>
                <Link href="/join?mode=signup" className="flex-1">
                  <button className="w-full rounded-full bg-foreground text-background h-9 px-4 text-xs font-bold hover:bg-foreground/90 transition-all cursor-pointer">
                    Verify &amp; Join
                  </button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
