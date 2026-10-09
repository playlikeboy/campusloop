import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LivingHubClient } from "../living/living-hub-client";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Campus Hub | Living, Housing, Marketplace & Services | CampusLoop",
  description:
    "Everything you need around campus: verified housing, roommate matching, marketplace, lost and found, and cab sharing.",
  alternates: { canonical: "https://campusloop.space/campus" },
};

export default async function CampusPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <LivingHubClient profileId={profile.id} userInstitution={profile.institutionId} />;
}
