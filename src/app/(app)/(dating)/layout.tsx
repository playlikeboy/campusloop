import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/ui/navigation";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Campus Match · Dating & Friends | CampusLoop",
  description:
    "Connect with verified students across your college campus for friends, study buddies, and dating.",
  openGraph: {
    title: "Campus Match · Dating & Friends | CampusLoop",
    description:
      "Connect with verified students across your college campus for friends, study buddies, and dating.",
    url: "https://campusloop.space/dating",
    siteName: "CampusLoop Match",
    images: [
      { url: "https://campusloop.space/og-dating.png", width: 1536, height: 1024, alt: "CampusLoop Match" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Match · Dating & Friends | CampusLoop",
    description:
      "Connect with verified students across your college campus for friends, study buddies, and dating.",
    images: ["https://campusloop.space/og-dating.png"],
  },
};

export default async function DatingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  if (!user) {
    redirect("/sign-in?returnTo=/dating");
  }

  const profile = await getCachedUserProfile(user.id);
  if (!profile?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const college = profile.institution;
  const viewerMode = await isViewerProfile(profile);

  return (
    <div className="relative min-h-screen bg-background flex flex-col lg:flex-row">
      <Navigation
        profile={profile}
        collegeName={viewerMode ? "Viewer Mode" : (college?.name ?? "Campus")}
        isAdmin={profile.role === "ADMIN"}
        isViewer={viewerMode}
      />
      <div className="flex-1 w-full min-w-0 max-w-7xl mx-auto overflow-x-clip px-0 sm:px-6 py-0 sm:py-6 pb-24 sm:pb-6">
        {children}
      </div>
    </div>
  );
}
