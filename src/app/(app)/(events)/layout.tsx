import { Eye } from "lucide-react";
import type { Metadata } from "next";
import { FirstVisitNotificationPrompt } from "@/components/notifications/first-visit-notification-prompt";
import { Navigation } from "@/components/ui/navigation";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

export const metadata: Metadata = {
  title: {
    default: "Events | CampusLoop",
    template: "%s | CampusLoop",
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
            <div className="flex justify-end py-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                <Eye className="size-3 shrink-0" />
                Preview · verify email to host or register
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
