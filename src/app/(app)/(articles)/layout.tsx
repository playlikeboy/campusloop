import { Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditorialHeader } from "@/components/articles/editorial-header";
import { ARTICLES_CANONICAL_HOST } from "@/constants/articles";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

export const metadata: Metadata = {
  title: {
    default: "CampusLoop Articles | Student Stories, Guides & Placement Roadmaps",
    template: "%s | CampusLoop Articles",
  },
  description:
    "Long-form placement guides, interview experiences, tech deep-dives, and campus journalism written by verified students across 1,350+ Indian colleges.",
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

export default async function ArticlesLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  if (user && profile && !profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  const viewerMode = profile ? await isViewerProfile(profile) : false;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20">
      {/* ─── Editorial Navigation Bar ─── */}
      <EditorialHeader profile={profile} />

      {/* ─── Viewer Mode Banner ─── */}
      {viewerMode && (
        <div className="sticky top-14 z-40 flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-semibold text-amber-600 dark:text-amber-400 backdrop-blur-md">
          <Eye className="size-3.5 text-amber-500 shrink-0" />
          <span>
            You&apos;re browsing in <strong>Viewer Mode</strong> — connect your campus email to publish
            articles and earn LP.
          </span>
        </div>
      )}

      {/* ─── Publication Content Stream ─── */}
      <main className="flex-1 w-full">{children}</main>

      {/* ─── Minimal Publication Footer ─── */}
      <footer className="border-t border-border/30 bg-muted/20 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="CampusLoop" className="size-5 object-contain" />
            <span className="font-bold text-foreground">CampusLoop Articles</span>
            <span>— Verified Indian Student Network</span>
          </div>

          <div className="flex items-center gap-4 font-semibold">
            <Link href="/feeds" className="hover:text-foreground">
              Campus Feed
            </Link>
            <Link href="/articles/new" className="hover:text-foreground">
              Write Article
            </Link>
            <Link href="/safety" className="hover:text-foreground">
              Guidelines
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
