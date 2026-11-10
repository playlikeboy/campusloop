import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { LaundryMarketplaceClient } from "./laundry-client";

export const metadata: Metadata = privateMetadata("Laundry");

export default async function LaundryMarketplacePage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <LaundryMarketplaceClient profileId={profile.id} collegeName={profile.institution?.name} />;
}
