import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { RideshareClient } from "./rideshare-client";

// Signed-in only: visitors are sent to sign-in, so search engines can't read it.
export const metadata: Metadata = privateMetadata("Ride share");

export default async function RidesharePage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <RideshareClient profileId={profile.id} />;
}
