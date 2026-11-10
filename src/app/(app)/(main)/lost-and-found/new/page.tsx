import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { NewLostFoundClient } from "./new-lost-found-client";

export const metadata: Metadata = privateMetadata("Report an item");

export default async function NewLostAndFoundPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return (
    <NewLostFoundClient
      profileId={profile.id}
      defaultCampusName={profile.institution?.name || "your college"}
    />
  );
}
