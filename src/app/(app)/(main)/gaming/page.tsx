import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GamingClient } from "@/components/gaming/gaming-client";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Gaming Arena | Campus Esports, Lobbies & Tournaments",
  description: "Find college teammates, scrim lobbies, and host Valorant, BGMI, and Chess campus tournaments.",
  alternates: { canonical: "https://campusloop.space/gaming" },
};

export default async function GamingArenaPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <GamingClient profileId={profile.id} />;
}

