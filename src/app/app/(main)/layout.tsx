import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FirstVisitNotificationPrompt } from "@/components/notifications/first-visit-notification-prompt";
import { Navigation } from "@/components/ui/navigation";
import { RightSidebar } from "@/components/ui/right-sidebar";
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
    url: "https://campusloop.space/app",
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

  if (user && !profile?.onboardingCompleted) {
    redirect("/app/onboarding");
  }

  const college = profile?.institution;
  const viewerMode = profile ? await isViewerProfile(profile) : true;

  return (
    <div className="app-surface relative min-h-screen bg-pastel-mesh text-foreground">
      <Navigation
        profile={profile || undefined}
        collegeName={viewerMode ? "Viewer Mode" : (college?.name ?? "Campus")}
        isAdmin={profile?.role === "ADMIN"}
        isViewer={viewerMode}
      />

      <div className="flex md:pl-[248px] min-h-screen max-w-full overflow-x-clip">
        <main className="flex-1 w-full min-w-0 max-w-full min-h-screen">
          {viewerMode && (
            <div className="sticky top-0 z-30 flex min-h-8 items-center justify-center border-b border-amber-500/15 bg-amber-500/8 px-3 py-1.5 text-center text-[11px] font-medium text-amber-700 dark:text-amber-300 backdrop-blur-md">
              <span>
                Preview mode · <strong>Verify your college email</strong> to post, vote &amp; chat.
              </span>
            </div>
          )}
          {children}
          <FirstVisitNotificationPrompt />
        </main>
        <aside className="hidden lg:block w-80 xl:w-[350px] shrink-0 border-l border-border/45 bg-background/35 px-4 py-4">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
}
