import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FirstVisitNotificationPrompt } from "@/components/notifications/first-visit-notification-prompt";
import { Navigation } from "@/components/ui/navigation";
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
    <div className="app-surface relative min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      <Navigation
        profile={profile || undefined}
        collegeName={viewerMode ? "Viewer Mode" : (college?.name ?? "Campus")}
        isAdmin={profile?.role === "ADMIN"}
        isViewer={viewerMode}
      />
      <div className="flex-1 w-full min-w-0 max-w-7xl mx-auto overflow-x-clip px-0 sm:px-6 lg:px-8 pt-0 sm:pt-6 pb-24 sm:pb-6">
        {viewerMode && (
          <div className="mx-3 sm:mx-0 my-2 sm:my-0 sm:mb-4 flex min-h-8 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-center text-xs font-medium text-amber-700 dark:text-amber-300 backdrop-blur-md">
            <span>
              Preview mode · <strong>Verify your college email</strong> to post, vote &amp; chat.
            </span>
          </div>
        )}
        {children}
        <FirstVisitNotificationPrompt />
      </div>
    </div>
  );
}
