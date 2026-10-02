import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfessionsFeedSkeleton } from "@/components/ui/skeleton-card";
import { ConfessionsFeed } from "./confessions-feed";

export const metadata: Metadata = {
  title: "Campus Confessions — 100% Anonymous & Cryptographically Sealed",
  description:
    "Read and whisper unfiltered campus confessions, hostel lore, placement tea, and exam vents from 1,350+ Indian colleges. 100% anonymous, identity-sealed with HMAC pseudonyms.",
  keywords: [
    "Campus Confessions",
    "College Anonymous Confessions",
    "Indian College Confessions",
    "Anonymous Student Posts",
    "Hostel Lore",
    "Placement Tea",
    "Campus Secrets",
    "College Crushes",
  ],
  alternates: { canonical: "https://campusloop.space/confessions" },
  openGraph: {
    title: "Campus Confessions — 100% Anonymous College Whispers",
    description: "Read and whisper anonymous campus secrets safely. Sealed with cryptographic pseudonyms.",
    url: "https://campusloop.space/confessions",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-confessions.png",
        width: 1536,
        height: 1024,
        alt: "CampusLoop Confessions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anonymous Campus Confessions | CampusLoop",
    description: "Whisper unfiltered campus secrets. 100% verified students, zero real identity trace.",
    images: ["https://campusloop.space/og-confessions.png"],
  },
  robots: { index: true, follow: true },
};

export default function ConfessionsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Campus Confessions Feed",
    url: "https://campusloop.space/confessions",
    description: "Cryptographically protected anonymous student confessions feed across Indian college hubs.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop Inc.",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense
        fallback={
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <main className="lg:col-span-8 flex flex-col min-h-screen bg-card/25 rounded-2xl border border-border/25 p-4 space-y-4">
                <div className="h-10 w-48 bg-muted/40 rounded-full animate-pulse" />
                <ConfessionsFeedSkeleton />
              </main>
              <div className="hidden lg:block lg:col-span-4 space-y-4">
                <div className="h-44 rounded-2xl bg-muted/20 animate-pulse" />
                <div className="h-32 rounded-2xl bg-muted/20 animate-pulse" />
              </div>
            </div>
          </div>
        }
      >
        <ConfessionsFeed />
      </Suspense>
    </>
  );
}
