import { redirect } from "next/navigation";
import { GamingClient } from "@/components/gaming/gaming-client";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

// Sign-in only: signed-out visitors are redirected, so there is nothing to index.
export const metadata = privateMetadata("Gaming");

export default async function GamingPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in?returnTo=/gaming");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <GamingClient profileId={profile.id} />;
}
