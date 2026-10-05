import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CleanFooter } from "@/components/landing/clean-footer";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";
import { VoxelCTA } from "@/components/landing/voxel-cta";
import { VoxelHero } from "@/components/landing/voxel-hero";
import { VoxelPillars } from "@/components/landing/voxel-pillars";
import { VoxelTrust } from "@/components/landing/voxel-trust";
import { VoxelValueProp } from "@/components/landing/voxel-value-prop";
import { PwaLaunchRedirect } from "@/components/pwa/pwa-launch-redirect";
import { hexclaveServerApp } from "@/hexclave/server";

const SITE_URL = "https://campusloop.space";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CampusLoop — Your Campus, All in One Place",
  description:
    "A verified student network for conversations, academic notes, clubs, and events across Indian colleges and universities.",
  applicationName: "CampusLoop",
  authors: [{ name: "CampusLoop Team", url: `${SITE_URL}/about` }],
  keywords: [
    "CampusLoop",
    "campus social network",
    "verified student network",
    "college community India",
    "academic notes",
    "college PYQs",
    "campus events",
    "college clubs",
    "college directory",
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
    title: "CampusLoop — Your Campus, All in One Place",
    description:
      "Find people, resources, communities, and events around your campus. Verified student network for college life.",
    url: SITE_URL,
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/campusloop/marketing/voxel/social-preview.webp`,
        width: 1200,
        height: 630,
        alt: "CampusLoop — Verified digital campus network for college students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop — Your Campus, All in One Place",
    description:
      "Find people, resources, communities, and events around your campus. Verified student network for college life.",
    creator: "@mycampusloop",
    images: [`${SITE_URL}/campusloop/marketing/voxel/social-preview.webp`],
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
          "Verified digital campus platform for college students with conversations, notes, PYQs, communities, and campus events.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
      },
    ],
  };

  return (
    <div className="campusloop-landing min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <PwaLaunchRedirect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Accessibility Skip Link */}
      <a
        href="#main-landing-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-primary focus:text-white focus:shadow-xl focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Skip to main campus content
      </a>

      {/* Header */}
      <MinimalLandingNavbar isAuthenticated={isAuthenticated} />

      {/* Semantic Screen-Reader Overview */}
      <section
        className="sr-only"
        aria-label="CampusLoop Overview for Search Engines and Screen Readers"
      >
        <h2>CampusLoop — The Verified Campus Network</h2>
        <p>
          CampusLoop connects verified college students with peer-shared notes, student clubs, campus events, and university communities across India.
        </p>
      </section>

      {/* Main Storytelling Flow */}
      <main id="main-landing-content" className="flex-1">
        <VoxelHero isAuthenticated={isAuthenticated} />
        <VoxelPillars />
        <VoxelValueProp />
        <VoxelTrust />
        <VoxelCTA isAuthenticated={isAuthenticated} />
      </main>

      {/* Footer */}
      <CleanFooter />
    </div>
  );
}
