import type { Metadata } from "next";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { SOCIAL_SAME_AS } from "@/constants/social";
import { getPublicStats } from "@/lib/public-stats";
import { PitchClient } from "./pitch-client";

export const metadata: Metadata = {
  title: "Pitch · CampusLoop",
  description:
    "CampusLoop's investor pitch: the problem with fragmented campus life, the verified student network we built at BIT Mesra, the market, the business model and the roadmap. Deck PDF included.",
  keywords: ["CampusLoop Pitch Deck", "Investor Brief", "College Social Network India", "CampusLoop Business Model"],
  alternates: { canonical: "https://campusloop.space/pitch" },
  openGraph: {
    title: "Pitch · CampusLoop",
    description: "The verified student network for Indian colleges: problem, product, market, model and roadmap.",
    url: "https://campusloop.space/pitch",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "CampusLoop pitch" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pitch · CampusLoop",
    description: "The verified student network for Indian colleges: problem, product, market, model and roadmap.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default async function PitchPage() {
  const stats = await getPublicStats();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CampusLoop Investor Pitch",
    url: "https://campusloop.space/pitch",
    description: "Investor pitch and downloadable deck for CampusLoop, the verified college social network.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      legalName: "CampusLoop (not yet incorporated)",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
      founder: { "@type": "Person", name: "Shaswat Raj" },
      sameAs: SOCIAL_SAME_AS,
    },
    mainEntity: {
      "@type": "DigitalDocument",
      name: "CampusLoop Pitch Deck",
      url: "https://campusloop.space/pitch.pdf",
      fileFormat: "application/pdf",
    },
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PitchClient stats={stats} />
    </MarketingShell>
  );
}
