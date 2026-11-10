import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CollegeHubClient } from "@/components/colleges/college-hub-client";
import { getDb } from "@/db";
import { academicResources, institutions, posts } from "@/db/schema";
import type { FeedPost } from "@/hooks/use-feed";
import { sanitizeAnonRow } from "@/lib/anonymity";
import { getShowSeededPosts } from "@/lib/platform-config";
import { breadcrumbJsonLd, buildMetadata, collegeJsonLd, ogImageUrl } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { getCachedAuthUser, getCachedInstitution, getCachedUserProfile } from "@/lib/server-cache";
import { getInstitutionEmailFormat, VERIFIED_STUDENT_EMAIL_DOMAINS } from "@/lib/student-email-domains";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const college = await getCachedInstitution(id).catch(() => null);

  if (!college) {
    return buildMetadata({
      title: "College not found",
      description: "We couldn't find this college. Search the college list to find yours.",
      path: "/colleges",
      noindex: true,
    });
  }

  const place = [college.district, college.state].filter(Boolean).join(", ");
  return buildMetadata({
    title: college.name,
    description: `See posts, notes and students from ${college.name}${place ? ` in ${place}` : ""}. Join with your college email to post and chat.`,
    path: `/college/${college.slug || college.id}`,
    image: ogImageUrl(college.name, "College"),
    keywords: [college.name, `${college.name} students`, `${college.name} notes`, `${college.name} PYQs`],
  });
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

  // One canonical URL per college: ids and loose matches redirect to the slug page.
  if (id !== "viewer-hub" && college.slug && id !== college.slug) {
    permanentRedirect(`/college/${college.slug}`);
  }

  const showSeeded = await getShowSeededPosts();

  // Posts, nearby colleges (same state) and study material, fetched in parallel
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

  // Students who joined from this college
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

  // Extract hashtags from posts
  const hashtagSet = new Set<string>();
  collegePosts.forEach((p) => {
    const matches = p.body.match(HASHTAG_REGEX);
    if (matches) {
      matches.forEach((tag) => hashtagSet.add(tag.slice(1)));
    }
  });
  const trendingTags = Array.from(hashtagSet).slice(0, 8);

  const relatedColleges = rawRelatedColleges
    .filter((c) => c.id !== college.id)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      district: c.district,
      state: c.state,
      studentsCount: c.profiles?.length || 0,
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

  // Merge verified student domains from curated registry (e.g. branch subdomains for IIT ISM, IIT KGP, etc.)
  const curatedDomains = VERIFIED_STUDENT_EMAIL_DOMAINS[college.slug?.toLowerCase() || ""] || [];
  curatedDomains.forEach((d) => {
    const clean = d.toLowerCase().trim();
    if (!domainMap.has(clean)) {
      domainMap.set(clean, { domain: clean, type: "STUDENT_EMAIL", isPrimary: false });
    }
  });

  if (domainMap.size === 0 && college.website) {
    try {
      const parsed = college.website.startsWith("http")
        ? new URL(college.website)
        : new URL(`https://${college.website}`);
      const host = parsed.hostname
        .replace(/^www\./, "")
        .toLowerCase()
        .trim();
      if (host) {
        domainMap.set(host, { domain: host, type: "WEBSITE", isPrimary: true });
      }
    } catch {
      // Ignore invalid URL
    }
  }

  const allowedDomains = Array.from(domainMap.values());
  // Verified = a student email domain confirmed by students/admins or in the curated registry.
  const isVerifiedCollege =
    curatedDomains.length > 0 ||
    (college.domains || []).some(
      (row) => row.verificationStatus === "STUDENT_VERIFIED" || row.verificationStatus === "ADMIN_VERIFIED"
    );
  const emailFormatInfo = getInstitutionEmailFormat(college.slug || "");

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
  const collegePath = `/college/${college.slug || college.id}`;

  return (
    <>
      <JsonLd
        data={[
          collegeJsonLd({
            name: college.name,
            path: collegePath,
            website: college.website
              ? college.website.startsWith("http")
                ? college.website
                : `https://${college.website}`
              : null,
            city: college.district,
            state: college.state,
            logo: college.logoUrl,
          }),
          breadcrumbJsonLd([
            { name: "Colleges", path: "/colleges" },
            { name: college.name, path: collegePath },
          ]),
        ]}
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
        emailFormatInfo={emailFormatInfo}
        initialPosts={formattedPosts}
        academics={formattedAcademics}
        students={students}
        relatedColleges={relatedColleges}
        currentUserId={profile?.id}
        isEnrolledHere={isEnrolledHere}
        isVerifiedCollege={isVerifiedCollege}
        trendingTags={trendingTags}
      />
    </>
  );
}
