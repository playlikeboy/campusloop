import type { Metadata } from "next";
import { ClosedEventsClient } from "./closed-events-client";

export const metadata: Metadata = {
  title: "Closed & Past Campus Events | CampusLoop",
  description:
    "Explore concluded college hackathons, fests, coding competitions, and academic workshops across 1,350+ Indian universities on CampusLoop.",
  keywords: [
    "Past Campus Events",
    "Closed Hackathons",
    "Past College Fests India",
    "Hackathon Archives",
    "Student Competitions Archive",
    "CampusLoop Events",
  ],
  alternates: { canonical: "https://campusloop.space/events/closed" },
  openGraph: {
    title: "Closed & Past Campus Events | CampusLoop",
    description:
      "Explore concluded college hackathons, fests, and workshops across 1,350+ Indian universities.",
    url: "https://campusloop.space/events/closed",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-image.png",
        width: 1200,
        height: 630,
        alt: "Closed & Past Campus Events",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Closed & Past Campus Events | CampusLoop",
    description:
      "Explore concluded college hackathons, fests, and workshops across 1,350+ Indian universities.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function ClosedEventsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Concluded Indian College Events & Hackathon Archive",
    url: "https://campusloop.space/events/closed",
    description:
      "Archive of past university hackathons, workshops, and college cultural fests on CampusLoop.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ClosedEventsClient />
    </>
  );
}
