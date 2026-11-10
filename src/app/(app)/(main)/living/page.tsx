import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { LivingHubClient } from "./living-hub-client";

// Signed-in only: visitors are sent to sign-in, so search engines can't read it.
export const metadata: Metadata = privateMetadata("Campus living");

export default async function LivingPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <LivingHubClient profileId={profile.id} userInstitution={profile.institutionId} />;
}
