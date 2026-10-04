import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HousingClient } from "./housing-client";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Housing & Flats | Student PGs & Roommates | CampusLoop",
  description: "Find verified student PGs, apartments, shared flats, and roommates near college campus.",
  alternates: { canonical: "https://campusloop.space/housing" },
  openGraph: {
    title: "Housing & Flats | Student PGs & Roommates | CampusLoop",
    description: "Find verified student PGs, apartments, shared flats, and roommates near college campus.",
    url: "https://campusloop.space/housing",
    siteName: "CampusLoop Housing",
    images: [
      {
        url: "https://campusloop.space/og-housing.png",
        width: 1536,
        height: 1024,
        alt: "CampusLoop Housing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Housing & Flats | Student PGs & Roommates | CampusLoop",
    description: "Find verified student PGs, apartments, shared flats, and roommates near college campus.",
    images: ["https://campusloop.space/og-housing.png"],
  },
};

export default async function HousingPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <HousingClient profileId={profile.id} />;
}
