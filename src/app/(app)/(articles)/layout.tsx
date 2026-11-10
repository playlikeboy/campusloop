import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shells/app-shell";
import { ARTICLES_CANONICAL_HOST } from "@/constants/articles";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

export const metadata: Metadata = {
  title: {
    default: "Articles",
    template: "%s · CampusLoop",
  },
  description:
    "Long-form placement guides, interview experiences, tech deep-dives, and campus journalism written by verified students across Indian colleges.",
  alternates: {
    canonical: `${ARTICLES_CANONICAL_HOST}/articles`,
  },
  openGraph: {
    title: "CampusLoop Articles | Student Stories & Placement Roadmaps",
    description:
      "Read long-form campus stories, tech guides, and placement roadmaps written by verified college students.",
    url: `${ARTICLES_CANONICAL_HOST}/articles`,
    siteName: "CampusLoop Articles",
    images: [
      {
        url: `${ARTICLES_CANONICAL_HOST}/og-articles.png`,
        width: 1536,
        height: 1024,
        alt: "CampusLoop Articles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop Articles | Student Stories & Placement Roadmaps",
    description:
      "Read long-form campus stories, tech guides, and placement roadmaps written by verified college students.",
    images: [`${ARTICLES_CANONICAL_HOST}/og-articles.png`],
  },
};

/** Articles are public: signed-out readers get the shell with a Sign in action. */
export default async function ArticlesLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  if (user && profile && !profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  const viewerMode = profile ? await isViewerProfile(profile) : false;

  return (
    <AppShell
      profile={profile || undefined}
      collegeName={viewerMode ? "Viewer Mode" : (profile?.institution?.name ?? undefined)}
      isAdmin={profile?.role === "ADMIN"}
      isViewer={viewerMode}
    >
      {children}
    </AppShell>
  );
}
