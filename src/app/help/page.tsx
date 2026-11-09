import type { Metadata } from "next";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { FAQS } from "./faqs";
import { HelpClient } from "./help-client";

export const metadata: Metadata = {
  title: "Help · CampusLoop",
  description:
    "Answers about college email verification, the Academic Vault, anonymous posting, reporting and safety, and campus communities.",
  keywords: ["CampusLoop Help", "CampusLoop FAQ", "Student Verification Help", "Academic Vault Guide", "Campus Safety FAQ"],
  alternates: { canonical: "https://campusloop.space/help" },
  openGraph: {
    title: "Help · CampusLoop",
    description: "Answers about verification, the Academic Vault, anonymous posting and safety.",
    url: "https://campusloop.space/help",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630, alt: "CampusLoop Help" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Help · CampusLoop",
    description: "Answers about verification, the Academic Vault, anonymous posting and safety.",
    images: ["https://campusloop.space/og-image.png"],
  },
};

export default function HelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HelpClient />
    </MarketingShell>
  );
}
