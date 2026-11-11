import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shells/app-shell";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile, toShellProfile } from "@/lib/server-cache";

export const metadata: Metadata = privateMetadata("Chats");

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  // The messenger owns its header and scroll regions, so the shell goes full-bleed.
  return (
    <AppShell
      profile={toShellProfile(profile)}
      collegeName={profile.institution?.name ?? "Your College"}
      isAdmin={profile.role === "ADMIN"}
      fullBleed
    >
      {children}
    </AppShell>
  );
}
