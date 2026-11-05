import type { Metadata } from "next";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { ContactClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact · CampusLoop",
  description:
    "Reach CampusLoop support, the safety desk, privacy requests, college partnerships, press, or the Grievance Officer (Shaswat Raj, grievance@campusloop.space).",
  keywords: ["Contact CampusLoop", "CampusLoop Support", "Grievance Officer", "Campus Partnership", "College Domain"],
  alternates: { canonical: "https://campusloop.space/contact" },
  openGraph: {
    title: "Contact · CampusLoop",
    description: "Support, safety, privacy, partnerships, press and the Grievance Officer.",
    url: "https://campusloop.space/contact",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "Contact CampusLoop" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact · CampusLoop",
    description: "Support, safety, privacy, partnerships, press and the Grievance Officer.",
    images: ["https://campusloop.space/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact CampusLoop",
    url: "https://campusloop.space/contact",
    description: "Contact desks for CampusLoop support, college partnerships and grievance redressal under IT Rules 2021.",
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      legalName: "CampusLoop (not yet incorporated)",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
      founder: { "@type": "Person", name: "Shaswat Raj" },
      contactPoint: [
        {
          "@type": "ContactPoint",
          email: "support@campusloop.space",
          contactType: "customer support",
          areaServed: "IN",
          availableLanguage: ["en", "hi"],
        },
        {
          "@type": "ContactPoint",
          email: "grievance@campusloop.space",
          contactType: "grievance redressal",
          areaServed: "IN",
        },
      ],
    },
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContactClient />
    </MarketingShell>
  );
}
