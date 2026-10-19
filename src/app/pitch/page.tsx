import type { Metadata } from "next";
import { PitchClient } from "./pitch-client";

export const metadata: Metadata = {
  title: "Investor Pitch Deck (PDF)",
  description:
    "Explore CampusLoop's market size, problem statements, unit economics, engagement loops, and interactive valuation model. Download the official seed pitch deck PDF.",
  keywords: [
    "CampusLoop Pitch Deck",
    "CampusLoop Pitch PDF",
    "Investor Brief",
    "College Social Network Valuation",
    "Gen Z Campus Social Network",
    "CampusLoop Business Model",
    "Download Pitch Deck PDF",
  ],
  alternates: { canonical: "https://campusloop.space/pitch" },
  openGraph: {
    title: "CampusLoop Investor Pitch Deck (PDF)",
    description: "Explore CampusLoop's market size, unit economics, and official seed pitch deck PDF.",
    url: "https://campusloop.space/pitch",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-image.png",
        width: 1200,
        height: 630,
        alt: "Investor Pitch Deck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop Investor Pitch Deck (PDF)",
    description: "Explore CampusLoop's market size, unit economics, and official seed pitch deck PDF.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function PitchPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CampusLoop Investor Pitch Deck",
    url: "https://campusloop.space/pitch",
    description: "Interactive strategic investor deck and downloadable PDF for CampusLoop, the verified college social network.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop Inc.",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
    },
    mainEntity: {
      "@type": "DigitalDocument",
      name: "CampusLoop Seed Investor Pitch Deck",
      url: "https://campusloop.space/pitch.pdf",
      fileFormat: "application/pdf",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PitchClient />
    </>
  );
}
