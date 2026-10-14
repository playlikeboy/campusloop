import type { Metadata } from "next";
import { AboutClient } from "@/components/about-client";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Discover CampusLoop: student communities, academics, campus events, gaming and esports, marketplace services, housing, rideshare and more.",
  keywords: [
    "About CampusLoop",
    "CampusLoop Mission",
    "Verified Student Network",
    "College Social Network India",
    "Student Community Platform",
    "Campus Gaming Arena",
    "Campus Marketplace",
    "Student Life Platform",
  ],
  alternates: { canonical: "https://campusloop.space/about" },
  openGraph: {
    title: "About Us",
    description: "Explore CampusLoop features for student life, from academic resources and campus communities to gaming, events and everyday services.",
    url: "https://campusloop.space/about",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-image.png",
        width: 1200,
        height: 630,
        alt: "About Us",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us",
    description: "Explore CampusLoop features for student life, from academic resources and campus communities to gaming, events and everyday services.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About CampusLoop",
    url: "https://campusloop.space/about",
    description:
      "CampusLoop brings student communities, academic resources, events, gaming and campus services together in one place.",
    mainEntity: {
      "@type": "Organization",
      name: "CampusLoop Inc.",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
      sameAs: [
        "https://www.instagram.com/campusloop.space/",
        "https://www.linkedin.com/company/mycampusloop/?viewAsMember=true",
        "https://x.com/company/mycampusloop/",
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AboutClient />
    </>
  );
}
