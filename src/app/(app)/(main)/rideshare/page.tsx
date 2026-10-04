import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RideshareClient } from "./rideshare-client";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Ride Share | Station & Airport Cab Pool | CampusLoop",
  description: "Split station and airport cab fares with verified college batchmates.",
  alternates: { canonical: "https://campusloop.space/rideshare" },
  openGraph: {
    title: "Ride Share | Station & Airport Cab Pool | CampusLoop",
    description: "Split station and airport cab fares with verified college batchmates.",
    url: "https://campusloop.space/rideshare",
    siteName: "CampusLoop Ride Share",
  },
};

export default async function RidesharePage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <RideshareClient profileId={profile.id} />;
}
