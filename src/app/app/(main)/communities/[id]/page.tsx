import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CommunityDetailClient } from "@/components/communities/community-detail-client";
import {
  getCommunityDirectory,
  getCommunityMembership,
} from "@/lib/communities/queries";
import {
  getCachedAuthUser,
  getCachedCommunitySummary,
  getCachedUserProfile,
} from "@/lib/server-cache";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const comm = await getCachedCommunitySummary(id);

  if (!comm) {
    return { title: "Community Sub-Hub" };
  }

  const title = `c/${comm.name} Sub-Hub | CampusLoop`;
  const description =
    comm.description ||
    `Join c/${comm.name} student sub-community on CampusLoop for discussions and campus conversations.`;
  const url = `https://campusloop.space/app/communities/${comm.slug || comm.id}`;

  return {
    title,
    description,
    keywords: [
      `c/${comm.name}`,
      comm.name,
      `${comm.name} college club`,
      "campus sub-hub",
      "student community",
    ],
    alternates: { canonical: url },
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
    robots: { index: comm.privacy === "PUBLIC", follow: comm.privacy === "PUBLIC" },
  };
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [user, comm] = await Promise.all([
    getCachedAuthUser(),
    getCachedCommunitySummary(id),
  ]);

  if (!comm) notFound();

  if (comm.privacy !== "PUBLIC" && !user) {
    redirect("/handler/sign-in");
  }

  const profile = user ? await getCachedUserProfile(user.id) : null;
  if (user && !profile) redirect("/app/onboarding");

  const membership = profile
    ? await getCommunityMembership(comm.id, profile.id)
    : null;
  const isMember = membership?.status === "ACTIVE";
  const isAdmin = Boolean(
    profile && (comm.creatorId === profile.id || membership?.role === "ADMIN")
  );

  const related = await getCommunityDirectory({
    profileId: profile?.id,
    limit: 8,
    sort: "popular",
  });

  const relatedCommunities = related
    .filter((community) => community.id !== comm.id)
    .slice(0, 4)
    .map((community) => ({
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      category: community.category,
      avatarUrl: community.avatarUrl,
      membersCount: community.memberCount,
      isMember: community.isMember,
    }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DiscussionForum",
            name: `c/${comm.name}`,
            description:
              comm.description ||
              `Sub-hub community for ${comm.name} on CampusLoop.`,
            url: `https://campusloop.space/app/communities/${comm.slug || comm.id}`,
            memberCount: comm.memberCount,
          }),
        }}
      />

      <CommunityDetailClient
        community={comm}
        initialMembersCount={comm.memberCount}
        initialIsMember={isMember}
        isAdmin={isAdmin}
        relatedCommunities={relatedCommunities}
      />
    </>
  );
}
