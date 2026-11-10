import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { BarberMarketplaceClient } from "./barber-client";

export const metadata: Metadata = privateMetadata("Barber");

export default async function BarberMarketplacePage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <BarberMarketplaceClient profileId={profile.id} collegeName={profile.institution?.name} />;
}
