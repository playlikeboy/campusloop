import type { Metadata } from "next";
import { FirstVisitNotificationPrompt } from "@/components/notifications/first-visit-notification-prompt";
import { AppShell } from "@/components/shells/app-shell";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

export const metadata: Metadata = {
  title: {
    default: "Events | CampusLoop",
    template: "%s · CampusLoop",
  },
};

export default async function EventsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;
  const college = profile?.institution;
  const viewerMode = profile ? await isViewerProfile(profile) : true;

  return (
    <AppShell
      profile={profile || undefined}
      collegeName={viewerMode ? "Viewer Mode" : (college?.name ?? "CampusLoop")}
      isAdmin={profile?.role === "ADMIN"}
      isViewer={viewerMode}
    >
      {children}
      <FirstVisitNotificationPrompt />
    </AppShell>
  );
}
