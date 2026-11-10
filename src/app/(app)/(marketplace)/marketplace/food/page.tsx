import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { FoodMarketplaceClient } from "./food-marketplace-client";

export const metadata: Metadata = privateMetadata("Food");

export default async function FoodMarketplacePage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <FoodMarketplaceClient profileId={profile.id} collegeName={profile.institution?.name} />;
}
