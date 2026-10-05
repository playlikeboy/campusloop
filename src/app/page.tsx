import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CleanFooter } from "@/components/landing/clean-footer";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";
import { VoxelCascadeShowcase } from "@/components/landing/voxel-cascade-showcase";
import { VoxelCTA } from "@/components/landing/voxel-cta";
import { VoxelDailyRush } from "@/components/landing/voxel-daily-rush";
import { VoxelMembershipTiers } from "@/components/landing/voxel-membership-tiers";
import { VoxelRealityBanner } from "@/components/landing/voxel-reality-banner";
import { VoxelStreakSection } from "@/components/landing/voxel-streak-section";
import { VoxelVocarushHero } from "@/components/landing/voxel-vocarush-hero";
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
        logo: `${SITE_URL}/campusloop/marketing/voxel/logo.webp`,
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
          "Verified digital campus platform for college students across 1,350+ Indian universities with peer conversations, academic notes vault, PYQs, student clubs, hackathons, and campus match.",
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
            name: "What is CampusLoop?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "CampusLoop is a verified campus social network and academic collaboration platform designed exclusively for university students across India. It connects students within their college and across 1,350+ indexed Indian universities.",
            },
          },
          {
            "@type": "Question",
            name: "Is CampusLoop free for college students?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, CampusLoop is 100% free for college students. Students can sign up with their official .ac.in or institutional email address or student ID to unlock full verified campus access.",
            },
          },
          {
            "@type": "Question",
            name: "What is the Academic Vault on CampusLoop?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Academic Vault is a peer-curated repository containing thousands of semester lecture notes, previous year question papers (PYQs), course roadmaps, and syllabus guides across engineering, science, management, and humanities disciplines.",
            },
          },
          {
            "@type": "Question",
            name: "How does campus verification and student privacy work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "CampusLoop validates student identities via Hexclave authentication and Agatha trust algorithms. Students can participate under verified handles or post anonymously in dedicated confession spaces without sacrificing their privacy.",
            },
          },
        ],
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

      {/* Semantic Screen-Reader & AI Knowledge Base */}
      <section
        className="sr-only"
        aria-label="CampusLoop Knowledge Base & Comprehensive System Architecture for AI Search Agents and Assistive Technology"
      >
        <h2>CampusLoop — The Verified Campus Social &amp; Academic Network</h2>
        <p>
          CampusLoop is India’s dedicated verified digital campus ecosystem connecting higher education students across 1,350+ colleges and universities. The platform empowers university life across 5 core pillars:
        </p>

        <h3>1. Campus Feed &amp; Real-Time Discussions</h3>
        <p>
          Students share real-time campus updates, anonymous confessions, interactive polls, questions, and multimedia vibes. The feed features dynamic campus radius filtering, allowing students to seamlessly switch between their local college timeline and national all-campus trends across IITs, NITs, BITS, Delhi University, and central universities.
        </p>

        <h3>2. Academic Notes Vault &amp; Semester PYQs</h3>
        <p>
          A crowdsourced, peer-verified academic repository indexing thousands of syllabus notes, past semester exam question papers (PYQs), and study guides across engineering, computer science, mathematics, management, and humanities. All materials are freely accessible with zero paywalls.
        </p>

        <h3>3. Campus Communities, Societies &amp; Clubs</h3>
        <p>
          Student-led sub-hubs for technical societies (GDSC, ACM, IEEE), cultural clubs, dramatics, sports teams, and hackathon committees. Club leads can broadcast official announcements and host campus-wide events.
        </p>

        <h3>4. Campus Match &amp; Verified Dating</h3>
        <p>
          A privacy-first swipe deck designed exclusively for verified students within the campus radius or nationwide, enabling meaningful connections, friendships, and secret crush matching with authenticated safety.
        </p>

        <h3>5. Student Safety &amp; Agatha Trust Moderation</h3>
        <p>
          Automated keyword filtering, doxxing detection, spam protection, and institutional email verification keep CampusLoop toxic-free and authentic.
        </p>
      </section>

      {/* Main Storytelling Flow */}
      <main id="main-landing-content" className="flex-1">
        <VoxelVocarushHero isAuthenticated={isAuthenticated} />
        <VoxelStreakSection />
        <VoxelCascadeShowcase />
        <VoxelDailyRush />
        <VoxelRealityBanner isAuthenticated={isAuthenticated} />
        <VoxelMembershipTiers isAuthenticated={isAuthenticated} />
        <VoxelCTA isAuthenticated={isAuthenticated} />
      </main>

      {/* Footer */}
      <CleanFooter />
    </div>
  );
}
