import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { BikeRentalsClient } from "./rentals-client";

export const metadata: Metadata = privateMetadata("Bike rentals");

export default async function RentalsPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <BikeRentalsClient profileId={profile.id} collegeName={profile.institution?.name} />;
}
