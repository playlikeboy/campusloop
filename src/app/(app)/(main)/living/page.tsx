import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LivingHubClient } from "./living-hub-client";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Living & Utilities | Campus Services | CampusLoop",
  description:
    "Everything you need around campus: student marketplace, verified PGs and flatmates, lost and found recovery, cab pooling, and campus atlas.",
  alternates: { canonical: "https://campusloop.space/living" },
  openGraph: {
    title: "Living & Utilities | Campus Services | CampusLoop",
    description:
      "Buy and sell second-hand gear, find verified housing, recover lost items, pool station rides, and explore campus.",
    url: "https://campusloop.space/living",
    siteName: "CampusLoop Living",
  },
};

export default async function LivingPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <LivingHubClient profileId={profile.id} userInstitution={profile.institutionId} />;
}
