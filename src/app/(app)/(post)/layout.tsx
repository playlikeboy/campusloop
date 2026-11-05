import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shells/app-shell";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Posts",
  description: "Explore student campus loops, confessions, polls, and discussions.",
  robots: { index: true, follow: true },
};

export default async function PostLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  if (user && !profile?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const college = profile?.institution;
  const viewerMode = profile ? await isViewerProfile(profile) : true;

  // The post deck scrolls itself; the shell goes full-bleed so wheel scroll stays on the deck.
  return (
    <AppShell
      profile={profile || undefined}
      collegeName={viewerMode ? "Viewer Mode" : (college?.name ?? "Campus")}
      isAdmin={profile?.role === "ADMIN"}
      isViewer={viewerMode}
      fullBleed
    >
      {children}
    </AppShell>
  );
}
