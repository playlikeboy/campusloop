import type { Metadata } from "next";
import { FirstVisitNotificationPrompt } from "@/components/notifications/first-visit-notification-prompt";
import { AcademicsSwitch } from "@/components/courses/academics-switch";
import { AppShell } from "@/components/shells/app-shell";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

export const metadata: Metadata = {
  title: {
    default: "Academic Notes, PYQs & Cheat Sheets | CampusLoop Academics",
    template: "%s · CampusLoop",
  },
  description:
    "Free semester exam question papers, formula cheat sheets, and lab manuals shared by verified college students across India.",
  openGraph: {
    title: "CampusLoop Academics | College Notes & Exam PYQs",
    description:
      "Free semester exam question papers, formula cheat sheets, and lab manuals.",
    url: "https://campusloop.space/academics",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
  },
};

/** Academics is browsable signed out; the shell shows Sign in instead of the profile. */
export default async function AcademicsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;
  const signedIn = Boolean(profile?.onboardingCompleted);
  const viewerMode = signedIn && profile ? await isViewerProfile(profile) : false;

  return (
    <AppShell
      profile={signedIn && profile ? profile : undefined}
      collegeName={viewerMode ? "Viewer Mode" : (profile?.institution?.name ?? undefined)}
      isAdmin={profile?.role === "ADMIN"}
      isViewer={viewerMode}
    >
      <AcademicsSwitch />
      {children}
      {signedIn && <FirstVisitNotificationPrompt />}
    </AppShell>
  );
}
