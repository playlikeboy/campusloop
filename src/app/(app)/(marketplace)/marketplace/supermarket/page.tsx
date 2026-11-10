import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { SupermarketMarketplaceClient } from "./supermarket-client";

export const metadata: Metadata = privateMetadata("Mart");

export default async function SupermarketPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <SupermarketMarketplaceClient profileId={profile.id} collegeName={profile.institution?.name} />;
}
