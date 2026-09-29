import type { Metadata } from "next";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";
import { FirstVisitNotificationPrompt } from "@/components/notifications/first-visit-notification-prompt";
import { WorkspaceHeader } from "@/components/layout/workspace-header";

export const metadata: Metadata = {
  title: {
    default: "Academic Notes, PYQs & Cheat Sheets | CampusLoop Academics",
    template: "%s | CampusLoop Academics",
  },
  description:
    "Free semester exam question papers, verified professor notes, formula cheat sheets, and lab manuals shared by verified college students across India.",
  openGraph: {
    title: "CampusLoop Academics | College Notes & Exam PYQs",
    description:
      "Free semester exam question papers, verified professor notes, formula cheat sheets, and lab manuals.",
    url: "https://campusloop.space/app/academics",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
  },
};

export default async function AcademicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;
  const authenticated = Boolean(profile?.onboardingCompleted);
  const viewerMode = authenticated && profile ? await isViewerProfile(profile) : false;

  return (
    <div
      data-workspace="academics"
      className="min-h-[100dvh] w-full overflow-x-clip bg-background text-foreground"
    >
      <WorkspaceHeader section="academics" authenticated={authenticated} />

      <main className="mx-auto min-h-[calc(100dvh-3rem)] w-full max-w-7xl min-w-0 overflow-x-clip px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:min-h-[calc(100dvh-3.5rem)] sm:px-6 sm:pt-3">
        {viewerMode && (
          <div className="mb-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center text-[11px] font-medium text-amber-700 dark:text-amber-300">
            You&apos;re browsing in Viewer Mode. Sign in with your college email to save notes,
            upload resources, and use student-only features.
          </div>
        )}

        {children}
      </main>

      {authenticated && <FirstVisitNotificationPrompt />}
    </div>
  );
}
