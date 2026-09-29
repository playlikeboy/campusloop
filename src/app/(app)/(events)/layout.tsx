import type { Metadata } from "next";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";
import { FirstVisitNotificationPrompt } from "@/components/notifications/first-visit-notification-prompt";
import { WorkspaceHeader } from "@/components/layout/workspace-header";

export const metadata: Metadata = {
  title: {
    default: "Campus Events, Hackathons & College Fests | CampusLoop",
    template: "%s | CampusLoop Events",
  },
  description:
    "Discover hackathons, technical workshops, college cultural fests, coding competitions, and campus meetups across 1,350+ Indian universities. Register solo or in teams on CampusLoop.",
  openGraph: {
    title: "Campus Events, Hackathons & College Fests | CampusLoop",
    description:
      "Join hackathons, tech bootcamps, and college fests with verified students from your campus and across India.",
    url: "https://campusloop.space/app/events",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-events.png",
        width: 1536,
        height: 1024,
        alt: "CampusLoop Events — Hackathons & College Fests",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Events, Hackathons & College Fests | CampusLoop",
    description:
      "Discover hackathons, technical workshops, and college cultural fests across Indian universities.",
    images: ["https://campusloop.space/og-events.png"],
  },
};

export default async function EventsLayout({
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
      data-workspace="events"
      className="min-h-[100dvh] w-full overflow-x-clip bg-background text-foreground"
    >
      <WorkspaceHeader section="events" authenticated={authenticated} />

      <main className="mx-auto min-h-[calc(100dvh-3rem)] w-full max-w-7xl min-w-0 overflow-x-clip px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:min-h-[calc(100dvh-3.5rem)] sm:px-6 sm:pt-3">
        {viewerMode && (
          <div className="mb-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center text-[11px] font-medium text-amber-700 dark:text-amber-300">
            You&apos;re browsing in Viewer Mode. Sign in with your college email to host events,
            register in teams, and earn Loop Points.
          </div>
        )}

        {children}
      </main>

      {authenticated && <FirstVisitNotificationPrompt />}
    </div>
  );
}
