import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { HubCreateClient } from "../../hub/new/hub-create-client";

export const metadata: Metadata = privateMetadata("Offer a ride");

export default async function NewRidesharePage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <HubCreateClient initialType="rideshare" profileId={profile.id} />;
}
