import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AcademicsQuickVault } from "@/components/landing/academics-quick-vault";
import { CampusTicker } from "@/components/landing/campus-ticker";
import { CampusVibeGrid } from "@/components/landing/campus-vibe-grid";
import { CleanCTA } from "@/components/landing/clean-cta";
import { CleanFAQ } from "@/components/landing/clean-faq";
import { CleanFooter } from "@/components/landing/clean-footer";
import { CreativeHero } from "@/components/landing/creative-hero";
import { InteractivePersonaFlip } from "@/components/landing/interactive-persona-flip";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";
import { MobileStickyBar } from "@/components/landing/mobile-sticky-bar";
import { PwaLaunchRedirect } from "@/components/pwa/pwa-launch-redirect";
import { hexclaveServerApp } from "@/hexclave/server";

const SITE_URL = "https://campusloop.space";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CampusLoop | Verified Student Social Network & Campus Hubs",
  description:
    "Join verified college students across India for real-time campus confessions, 24h stories, semester notes, PYQs, and student dating.",
  applicationName: "CampusLoop",
  authors: [{ name: "CampusLoop Team", url: `${SITE_URL}/about` }],
  keywords: [
    "CampusLoop",
    "campus social network India",
    "verified student network",
    "college community India",
    "college confessions",
    "campus communities",
    "college notes",
    "college PYQs",
    "college dating India",
    "Indian college directory",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    title: "CampusLoop | Verified Student Social Network",
    description: "Conversations, 24h vibes, semester notes, and student dating for verified Indian colleges.",
    url: SITE_URL,
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "CampusLoop — Verified student social network for Indian colleges",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop | Verified Student Social Network",
    description: "Conversations, 24h vibes, semester notes, and student dating for verified Indian colleges.",
    creator: "@mycampusloop",
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default async function LandingPage() {
  const user = await hexclaveServerApp.getUser();
  if (user) {
    redirect("/feeds");
  }
  const isAuthenticated = false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "CampusLoop",
        url: SITE_URL,
        logo: `${SITE_URL}/icons/icon-512x512.png`,
        sameAs: [
          "https://www.instagram.com/campusloop.space/",
          "https://www.linkedin.com/company/mycampusloop/",
          "https://x.com/mycampusloop",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "CampusLoop",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-IN",
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#software`,
        name: "CampusLoop",
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "Web",
        inLanguage: "en-IN",
        description:
          "Campus community platform for verified college students in India with confessions, stories, student dating, and academic resources.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "How do I get verified on my campus?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sign up with your college email (.edu, .ac.in, or university domain). You instantly unlock full voting, confession, DM, and notes download access.",
            },
          },
          {
            "@type": "Question",
            name: "Is anonymous posting really anonymous?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Anonymous posts and confessions have zero author identity attached to the public payload.",
            },
          },
          {
            "@type": "Question",
            name: "What if my college isn't listed yet?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Browse the Colleges Directory to request your campus hub. Over 1,350+ Indian colleges are already indexed.",
            },
          },
          {
            "@type": "Question",
            name: "Are academic notes and PYQs free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, completely free. Everything in the Academic Vault is uploaded and peer-reviewed by students for students.",
            },
          },
          {
            "@type": "Question",
            name: "Can I explore without an account first?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! You can explore in Viewer Mode to see campus trends, college hubs, and notes before creating an account.",
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="campusloop-landing min-h-screen flex flex-col bg-pastel-mesh text-foreground selection:bg-primary/20 selection:text-primary">
      <PwaLaunchRedirect />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Floating Pill Navigation */}
      <MinimalLandingNavbar isAuthenticated={isAuthenticated} />

      {/* Main Creative Mobile-First Flow */}
      <main className="flex-1">
        <CreativeHero isAuthenticated={isAuthenticated} />
        <CampusTicker />
        <InteractivePersonaFlip />
        <AcademicsQuickVault />
        <CampusVibeGrid />
        <CleanFAQ />
        <CleanCTA isAuthenticated={isAuthenticated} />
      </main>

      {/* Sleek Footer */}
      <CleanFooter />

      {/* Mobile-Only Floating Action Dock */}
      <MobileStickyBar isAuthenticated={isAuthenticated} />
    </div>
  );
}
