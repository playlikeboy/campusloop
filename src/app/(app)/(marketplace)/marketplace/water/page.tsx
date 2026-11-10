import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { WaterMarketplaceClient } from "./water-client";

export const metadata: Metadata = privateMetadata("Water cans");

export default async function WaterMarketplacePage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <WaterMarketplaceClient profileId={profile.id} collegeName={profile.institution?.name} />;
}
