import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shells/app-shell";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

// Only the title template lives here. Each page sets its own canonical and
// robots, so the editor and dashboard never inherit the public /articles URL.
export const metadata: Metadata = {
  title: { default: "Articles", template: "%s · CampusLoop" },
};

/** Articles are public: signed-out readers get the shell with a Sign in action. */
export default async function ArticlesLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  if (user && profile && !profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  const viewerMode = profile ? await isViewerProfile(profile) : false;

  return (
    <AppShell
      profile={profile || undefined}
      collegeName={viewerMode ? "Viewer Mode" : (profile?.institution?.name ?? undefined)}
      isAdmin={profile?.role === "ADMIN"}
      isViewer={viewerMode}
    >
      {children}
    </AppShell>
  );
}
