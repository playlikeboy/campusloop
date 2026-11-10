import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { CreateListingClient } from "./create-listing-client";

export const metadata: Metadata = privateMetadata("Sell something");

export default async function NewBuyAndSellPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <CreateListingClient profileId={profile.id} />;
}
