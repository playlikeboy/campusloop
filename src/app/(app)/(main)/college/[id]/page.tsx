import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollegeHubClient } from "@/components/colleges/college-hub-client";
import { getDb } from "@/db";
import { academicResources, institutions, posts } from "@/db/schema";
import type { FeedPost } from "@/hooks/use-feed";
import { sanitizeAnonRow } from "@/lib/anonymity";
import { getShowSeededPosts } from "@/lib/platform-config";
import { getCachedAuthUser, getCachedInstitution, getCachedUserProfile } from "@/lib/server-cache";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const college = await getCachedInstitution(id);

  if (!college) {
    return {
      title: "College Hub",
      description: "Explore Indian college rankings and student communities on CampusLoop.",
    };
  }

  const title = `${college.name} Campus Hub | CampusLoop`;
  const description = `Connect with verified students at ${college.name} (${college.district || college.state || "India"}). Confessions, clubs, campus Q&A, and live feed.`;
  const url = `https://campusloop.space/app/college/${college.slug || college.id}`;

  return {
    title,
    description,
    keywords: [
      college.name,
      `${college.name} campus`,
      `${college.name} students`,
      "college confessions",
      "campus life India",
      "verified student network",
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
      type: "website",
      images: [
        {
          url: "https://campusloop.space/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://campusloop.space/og-image.png"],
    },
    robots: { index: true, follow: true },
  };
}

const HASHTAG_REGEX = /#[a-zA-Z0-9_]+/g;

export default async function MainCollegePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCachedAuthUser();
  const db = getDb();

  // Fetch profile and institution in parallel with deduplicated request cache
  let [profile, college] = await Promise.all([
    user ? getCachedUserProfile(user.id) : Promise.resolve(null),
    getCachedInstitution(id),
  ]);

  if (!college && id === "viewer-hub") {
    college =
      (await db.query.institutions.findFirst({
        with: {
          profiles: true,
          domains: true,
        },
      })) ?? null;
  }

  if (!college) {
    notFound();
  }

  const showSeeded = await getShowSeededPosts();

  // Fetch posts, competitor campuses, and academic resources in parallel for optimal TTFB
  const [collegePosts, rawRelatedColleges, collegeAcademics] = await Promise.all([
    db.query.posts.findMany({
      where: and(
        eq(posts.institutionId, college.id),
        eq(posts.status, "PUBLISHED"),
        showSeeded ? undefined : eq(posts.isSeeded, false)
      ),
      orderBy: [desc(posts.createdAt)],
      limit: 30,
      with: {
        author: true,
        institution: true,
        community: true,
        votes: true,
        comments: true,
        pollOptions: {
          with: { votes: true },
        },
      },
    }),
    college.state
      ? db.query.institutions.findMany({
          where: eq(institutions.state, college.state),
          limit: 6,
          with: {
            profiles: true,
          },
        })
      : Promise.resolve([]),
    db.query.academicResources.findMany({
      where: eq(academicResources.institutionId, college.id),
      orderBy: [desc(academicResources.upvotesCount), desc(academicResources.createdAt)],
      limit: 25,
      with: {
        uploader: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    }),
  ]);

  const formattedPosts: FeedPost[] = collegePosts.map((post) => {
    const votesCount = post.votes.reduce((acc, vote) => acc + vote.value, 0);
    const commentsCount = post.comments.length;
    const userVote = profile ? post.votes.find((v) => v.userId === profile.id)?.value || 0 : 0;

    const formattedPollOptions = post.pollOptions?.map((opt) => {
      const optVotesCount = opt.votes.length;
      const userVoted = profile ? opt.votes.some((v) => v.userId === profile.id) : false;
      return { id: opt.id, text: opt.text, votesCount: optVotesCount, userVoted };
    });

    const hasVotedPoll = formattedPollOptions?.some((opt) => opt.userVoted) || false;
    const totalPollVotes = formattedPollOptions?.reduce((acc, opt) => acc + opt.votesCount, 0) || 0;

    return {
      ...sanitizeAnonRow(post),
      votesCount,
      commentsCount,
      userVote,
      pollOptions: formattedPollOptions,
      hasVotedPoll,
      totalPollVotes,
      votes: undefined,
      comments: undefined,
    } as unknown as FeedPost;
  });

  // Extract enrolled student profiles
  const students = (college.profiles || [])
    .filter((p) => (showSeeded ? true : !p.isSeeded))
    .map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    points: p.points,
    course: p.course,
    branch: p.branch,
    year: p.year,
    headline: p.headline,
  }));

  // Calculate Campus Collective Score & Points
  const studentCount = students.length;
  const totalStudentPoints = students.reduce((acc, p) => acc + (p.points || 0), 0);
  const postsCount = collegePosts.length;

  const collectivePoints = Math.round(studentCount * 60 + totalStudentPoints * 1.5 + postsCount * 25 + 500);

  // Extract hashtags from posts
  const hashtagSet = new Set<string>();
  collegePosts.forEach((p) => {
    const matches = p.body.match(HASHTAG_REGEX);
    if (matches) {
      matches.forEach((tag) => hashtagSet.add(tag.slice(1)));
    }
  });
  const trendingTags = Array.from(hashtagSet).slice(0, 8);
  if (trendingTags.length === 0) {
    const rawCode = (college.slug || college.name.split(" ")[0] || "Campus").replace(/[^a-zA-Z0-9]/g, "");
    trendingTags.push(`${rawCode}Life`, `${rawCode}Buzz`, "AskSeniors", "Placements", "CampusLife");
  }

  const relatedColleges = rawRelatedColleges
    .filter((c) => c.id !== college.id)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      district: c.district,
      state: c.state,
      studentsCount: c.profiles?.length || 0,
      points: Math.round(
        (c.profiles?.length || 0) * 50 +
          (c.profiles?.reduce((acc, p) => acc + (p.points || 0), 0) || 0) * 1.2 +
          300
      ),
    }));

  // Extract and deduplicate allowed email domains for this college
  const domainMap = new Map<string, { domain: string; type: string; isPrimary: boolean }>();

  if (college.websiteDomain) {
    const d = college.websiteDomain.toLowerCase().trim();
    domainMap.set(d, { domain: d, type: "STUDENT_EMAIL", isPrimary: true });
  }

  (college.domains || []).forEach((row) => {
    if (row.domain && row.verificationStatus !== "REJECTED") {
      const clean = row.domain.toLowerCase().trim();
      const existing = domainMap.get(clean);
      domainMap.set(clean, {
        domain: clean,
        type: row.domainType || (existing ? existing.type : "EMAIL"),
        isPrimary: existing ? existing.isPrimary : false,
      });
    }
  });

  if (domainMap.size === 0 && college.website) {
    try {
      const parsed = college.website.startsWith("http")
        ? new URL(college.website)
        : new URL(`https://${college.website}`);
      const host = parsed.hostname.replace(/^www\./, "").toLowerCase().trim();
      if (host) {
        domainMap.set(host, { domain: host, type: "WEBSITE", isPrimary: true });
      }
    } catch {
      // Ignore invalid URL
    }
  }

  const allowedDomains = Array.from(domainMap.values());

  const formattedAcademics = collegeAcademics.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    subjectCode: item.subjectCode,
    subjectName: item.subjectName,
    branch: item.branch,
    semester: item.semester,
    resourceType: item.resourceType,
    moduleOrChapter: item.moduleOrChapter,
    fileUrl: item.fileUrl,
    driveUrl: item.driveUrl,
    upvotesCount: item.upvotesCount,
    downloadsCount: item.downloadsCount,
    viewsCount: item.viewsCount,
    isVerified: item.isVerified,
    createdAt: item.createdAt,
    uploader: item.uploader,
  }));

  const isEnrolledHere = Boolean(profile && profile.institutionId === college.id);
  const canonicalCollegeUrl = `https://campusloop.space/app/college/${college.slug || college.id}`;

  return (
    <>
      {/* EducationalOrganization and Breadcrumbs JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "EducationalOrganization",
                name: college.name,
                url: college.website || canonicalCollegeUrl,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: college.district || undefined,
                  addressRegion: college.state || "India",
                  addressCountry: "IN",
                },
                identifier: college.aisheCode || undefined,
                foundingDate: college.yearOfEstablishment ? String(college.yearOfEstablishment) : undefined,
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: "https://campusloop.space/app",
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Colleges",
                    item: "https://campusloop.space/app/colleges",
                  },
                  {
                    "@type": "ListItem",
                    position: 3,
                    name: college.name,
                    item: canonicalCollegeUrl,
                  },
                ],
              },
            ],
          }),
        }}
      />

      <CollegeHubClient
        college={{
          id: college.id,
          slug: college.slug,
          name: college.name,
          state: college.state,
          district: college.district,
          website: college.website,
          websiteDomain: college.websiteDomain,
          yearOfEstablishment: college.yearOfEstablishment,
          aisheCode: college.aisheCode,
          locationType: college.locationType,
          logoUrl: college.logoUrl,
          bannerUrl: college.bannerUrl,
          nirfRank: college.nirfRank,
          description: college.description,
        }}
        allowedDomains={allowedDomains}
        initialPosts={formattedPosts}
        academics={formattedAcademics}
        students={students}
        relatedColleges={relatedColleges}
        collectivePoints={collectivePoints}
        currentUserId={profile?.id}
        isEnrolledHere={isEnrolledHere}
        trendingTags={trendingTags}
      />
    </>
  );
}
