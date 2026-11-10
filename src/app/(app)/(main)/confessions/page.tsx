import { Suspense } from "react";
import { ConfessionsFeedSkeleton } from "@/components/ui/skeleton-card";
import { buildMetadata } from "@/lib/seo";
import { ConfessionsFeed } from "./confessions-feed";

// Anonymous content is never indexed; robots.txt also disallows /confessions.
export const metadata = buildMetadata({
  title: "Confessions",
  description: "Anonymous confessions from students on CampusLoop. Your name is never shown on a confession.",
  path: "/confessions",
  image: { url: "/og-confessions.png", width: 1536, height: 1024, alt: "CampusLoop confessions" },
  noindex: true,
});

export default function ConfessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <main className="lg:col-span-8 flex flex-col min-h-dvh space-y-4" aria-busy="true">
              <span className="sr-only">Loading confessions</span>
              <div className="h-10 w-48 bg-surface-muted rounded-full animate-pulse" />
              <ConfessionsFeedSkeleton />
            </main>
            <div className="hidden lg:block lg:col-span-4 space-y-4">
              <div className="h-44 rounded-lg bg-surface-muted animate-pulse" />
              <div className="h-32 rounded-lg bg-surface-muted animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <ConfessionsFeed />
    </Suspense>
  );
}
