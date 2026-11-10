import { redirect } from "next/navigation";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { HubCreateClient } from "../../hub/new/hub-create-client";

export const metadata = privateMetadata("Host a lobby");

export default async function NewGamingPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in?returnTo=/gaming/new");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <HubCreateClient initialType="gaming" profileId={profile.id} />;
}
