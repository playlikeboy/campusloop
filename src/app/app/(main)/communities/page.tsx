import type { Metadata } from "next";
import { CommunitiesIndexClient } from "@/components/communities/communities-index-client";
import { getCommunityDirectory } from "@/lib/communities/queries";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Student Communities & Sub-Hubs",
  description:
    "Discover student-run clubs, academic circles, hobby groups, and campus communities on CampusLoop.",
  keywords: [
    "Student Communities",
    "College Sub-Hubs",
    "Campus Clubs",
    "Student Groups India",
    "Coding Clubs",
  ],
  alternates: { canonical: "https://campusloop.space/app/communities" },
  openGraph: {
    title: "Student Communities & Sub-Hubs | CampusLoop",
    description: "Discover student-run clubs, technical societies, and campus circles.",
    url: "https://campusloop.space/app/communities",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-communities.png",
        width: 1536,
        height: 1024,
        alt: "CampusLoop Communities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Communities, Clubs & Student Hubs | CampusLoop",
    description: "Explore student-run clubs, technical societies, and campus chapters.",
    images: ["https://campusloop.space/og-communities.png"],
  },
  robots: { index: true, follow: true },
};

export default async function CommunitiesPage() {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;
  const profileId = profile?.id || null;

  const [communities, joinedCommunities] = await Promise.all([
    getCommunityDirectory({
      profileId,
      limit: 40,
      sort: "popular",
    }),
    getCommunityDirectory({
      profileId,
      joinedOnly: true,
      limit: 16,
      sort: "recent",
    }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Student Communities & Campus Sub-Hubs",
    url: "https://campusloop.space/app/communities",
    description:
      "Directory of student-created technical clubs, cultural societies, and special interest groups.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CommunitiesIndexClient
        initialCommunities={communities}
        initialJoinedCommunities={joinedCommunities}
        profileId={profileId || ""}
      />
    </>
  );
}
