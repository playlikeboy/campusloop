import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FirstVisitNotificationPrompt } from "@/components/notifications/first-visit-notification-prompt";
import { AppShell } from "@/components/shells/app-shell";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Student Social Network",
  description:
    "Connect with verified students across Indian colleges. Share confessions, polls, and discussions.",
  openGraph: {
    title: "CampusLoop | Student Social Network",
    description:
      "Connect with verified students across Indian colleges. Share confessions, polls, and discussions.",
    url: "https://campusloop.space/feeds",
    siteName: "CampusLoop",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "CampusLoop" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop | Student Social Network",
    description:
      "Connect with verified students across Indian colleges. Share confessions, polls, and discussions.",
    images: ["https://campusloop.space/og-image.png"],
  },
};

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  if (user && !profile?.onboardingCompleted) redirect("/onboarding");

  const college = profile?.institution;
  const viewerMode = profile ? await isViewerProfile(profile) : true;

  return (
    <AppShell
      profile={profile || undefined}
      collegeName={viewerMode ? "Viewer Mode" : (college?.name ?? "Campus")}
      isAdmin={profile?.role === "ADMIN"}
      isViewer={viewerMode}
    >
      {children}
      <FirstVisitNotificationPrompt />
    </AppShell>
  );
}
