import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = privateMetadata("Checkout");

export default async function CheckoutPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <CheckoutClient profileId={profile.id} collegeName={profile.institution?.name} />;
}
