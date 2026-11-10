import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { HubCreateClient } from "../../hub/new/hub-create-client";

export const metadata: Metadata = privateMetadata("List a room");

export default async function NewHousingPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <HubCreateClient initialType="housing" profileId={profile.id} />;
}
