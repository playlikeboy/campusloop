import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LostFoundClient } from "./lost-found-client";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Lost & Found | Campus Recovery System | CampusLoop",
  description:
    "Report lost student IDs, keys, earphones, and reclaim found items safely on your college campus.",
  alternates: { canonical: "https://campusloop.space/lost-and-found" },
  openGraph: {
    title: "Lost & Found | Campus Recovery System | CampusLoop",
    description: "Report lost student IDs, keys, and reclaim found items safely on your college campus.",
    url: "https://campusloop.space/lost-and-found",
    siteName: "CampusLoop Lost & Found",
  },
};

export default async function LostAndFoundPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <LostFoundClient profileId={profile.id} />;
}
