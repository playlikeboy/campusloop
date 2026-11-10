import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LivingHubClient } from "../living/living-hub-client";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Campus Living Hub | Student Housing, Marketplace & Services",
  description:
    "Everything you need around campus: verified student housing without brokers, roommate matching, peer marketplace, lost and found, and cab sharing.",
  alternates: { canonical: "https://campusloop.space/campus" },
  openGraph: {
    title: "Campus Living Hub | Student Housing, Marketplace & Services",
    description:
      "Everything you need around campus: verified student housing without brokers, roommate matching, peer marketplace, lost and found, and cab sharing.",
    url: "https://campusloop.space/campus",
    siteName: "CampusLoop",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "Campus Living Hub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Living Hub | Student Housing, Marketplace & Services",
    description:
      "Everything you need around campus: verified student housing without brokers, roommate matching, peer marketplace, lost and found, and cab sharing.",
    images: ["https://campusloop.space/og-image.png"],
  },
};

export default async function CampusPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Campus Living Hub",
    description:
      "Verified student living services: housing, roommate matching, dorm marketplace, lost and found, and rideshare.",
    url: "https://campusloop.space/campus",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      url: "https://campusloop.space",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LivingHubClient profileId={profile.id} userInstitution={profile.institutionId} />
    </>
  );
}
