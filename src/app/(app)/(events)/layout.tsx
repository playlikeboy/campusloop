import { Eye } from "lucide-react";
import type { Metadata } from "next";
import { FirstVisitNotificationPrompt } from "@/components/notifications/first-visit-notification-prompt";
import { Navigation } from "@/components/ui/navigation";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

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
      "Discover hackathons, technical workshops, and college cultural fests across 1,350+ Indian universities.",
    images: ["https://campusloop.space/og-events.png"],
  },
};

export default async function EventsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;
  const college = profile?.institution;
  const viewerMode = profile ? await isViewerProfile(profile) : true;

  return (
    <div className="relative min-h-screen bg-background flex flex-col lg:flex-row">
      <Navigation
        profile={profile || undefined}
        collegeName={viewerMode ? "Viewer Mode" : (college?.name ?? "CampusLoop")}
        isAdmin={profile?.role === "ADMIN"}
        isViewer={viewerMode}
        hideHeader
      />

      <div className="flex min-h-screen w-full">
        <main className="flex-1 w-full min-w-0 max-w-7xl mx-auto min-h-screen px-3 sm:px-6 pt-0 pb-4">
          {viewerMode && profile && (
            <div className="sticky top-0 z-30 flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-[11px] font-semibold text-amber-600 dark:text-amber-400 backdrop-blur-md">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-3.5 shrink-0" />
                <span>
                  <strong>Preview mode</strong> · verify your college email to host or register for events.
                </span>
              </span>
            </div>
          )}
          {children}
          <FirstVisitNotificationPrompt />
        </main>
      </div>
    </div>
  );
}
