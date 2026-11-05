import type { Metadata } from "next";
import { DocsHubClient } from "@/components/docs/docs-hub-client";
import { CTABand } from "@/components/marketing/system";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { hexclaveServerApp } from "@/hexclave/server";
import { DOCS_FEATURES } from "@/lib/docs-features";

export const metadata: Metadata = {
  title: "Engineering Docs · CampusLoop",
  description:
    "Twelve engineering essays on how CampusLoop works: anonymous confessions, campus feed ranking, Secret Crush, polls, the student marketplace and verification.",
  keywords: [
    "CampusLoop docs",
    "CampusLoop architecture",
    "how CampusLoop works",
    "anonymous confessions explained",
    "college social network engineering",
    "BIT Mesra tech stack",
  ],
  alternates: { canonical: "https://campusloop.space/docs" },
  openGraph: {
    title: "Engineering Docs · CampusLoop",
    description: "Twelve engineering essays on campus networks, accountable anonymity and verification.",
    url: "https://campusloop.space/docs",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-image.png",
        width: 1200,
        height: 630,
        alt: "CampusLoop architectural documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Engineering Docs · CampusLoop",
    description: "Twelve engineering essays on campus networks, accountable anonymity and verification.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default async function DocsHubPage() {
  const user = await hexclaveServerApp.getUser();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "CampusLoop Architecture & Engineering Documentation",
    url: "https://campusloop.space/docs",
    description: "Engineering essays explaining each CampusLoop subsystem.",
    publisher: { "@type": "Organization", name: "CampusLoop", url: "https://campusloop.space" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: DOCS_FEATURES.map((f, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: f.title,
        url: `https://campusloop.space/docs/${f.slug}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingShell>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-12 sm:py-16 space-y-12">
          <div className="space-y-4 max-w-3xl">
            <p className="text-sm font-semibold text-brand-text">Engineering docs</p>
            <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">How CampusLoop works.</h1>
            <p className="text-base text-fg-muted leading-relaxed">
              Engineering essays on campus social networks, accountable anonymity, polling, the marketplace and
              verification.
            </p>
          </div>

          <DocsHubClient features={DOCS_FEATURES} />
        </main>

        <CTABand
          title="Read the architecture. Now see it live."
          lede="Every feature described here is live at campusloop.space."
          primaryHref={user ? "/feeds" : "/sign-up"}
          primaryLabel={user ? "Open your feed" : "Join with college email"}
          secondaryHref="/colleges"
          secondaryLabel="Find your college"
        />
      </MarketingShell>
    </>
  );
}
