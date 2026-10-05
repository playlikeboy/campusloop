import type { Metadata } from "next";
import { HelpClient } from "./help-client";

export const metadata: Metadata = {
  title: "Help & Frequently Asked Questions — CampusLoop",
  description:
    "Find answers to frequently asked questions about student verification, Academic Vault notes, anonymous handles, safety, and campus communities.",
  keywords: [
    "CampusLoop Help",
    "CampusLoop FAQ",
    "Student Verification Help",
    "Academic Vault Guide",
    "Campus Safety FAQ",
  ],
  alternates: { canonical: "https://campusloop.space/help" },
  openGraph: {
    title: "Help & FAQs — CampusLoop",
    description:
      "Find answers to frequently asked questions about student verification, Academic Vault notes, and campus safety.",
    url: "https://campusloop.space/help",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/campusloop/marketing/voxel/social-preview.webp",
        width: 1200,
        height: 630,
        alt: "CampusLoop Help Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Help & FAQs — CampusLoop",
    description:
      "Find answers to frequently asked questions about student verification, Academic Vault notes, and campus safety.",
    images: ["https://campusloop.space/campusloop/marketing/voxel/social-preview.webp"],
  },
};

export default function HelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I get verified on my campus?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sign up with your official college email domain (.ac.in or .edu). A one-time verification link confirms your active enrollment.",
        },
      },
      {
        "@type": "Question",
        name: "How does the Academic Vault work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Academic Vault hosts peer-uploaded lecture notes, syllabus guides, and 5-year solved previous year question papers (PYQs). It is 100% free for verified students.",
        },
      },
      {
        "@type": "Question",
        name: "Is anonymous posting traceable by peers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. When posting in anonymous mode, zero author identity is exposed on the public timeline. However, cryptographic identity escrow deters harassment, hate speech, and ragging.",
        },
      },
      {
        "@type": "Question",
        name: "What if my college isn't listed yet?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can request your college hub through the College Directory. Our team verifies new university email domains within 24 hours.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HelpClient />
    </>
  );
}
