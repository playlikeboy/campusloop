import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AcademicsQuickVault } from "@/components/landing/academics-quick-vault";
import { CampusLoopGraph } from "@/components/landing/campus-loop-graph";
import { CampusTicker } from "@/components/landing/campus-ticker";
import { CampusUtilityMatrix } from "@/components/landing/campus-utility-matrix";
import { CleanCTA } from "@/components/landing/clean-cta";
import { CleanFAQ } from "@/components/landing/clean-faq";
import { CleanFooter } from "@/components/landing/clean-footer";
import { CleanHero } from "@/components/landing/clean-hero";
import { CleanWorkflow } from "@/components/landing/clean-workflow";
import { InteractivePersonaFlip } from "@/components/landing/interactive-persona-flip";
import { InteractiveShowcase } from "@/components/landing/interactive-showcase";
import { MinimalLandingNavbar } from "@/components/landing/minimal-landing-navbar";
import { MobileStickyBar } from "@/components/landing/mobile-sticky-bar";
import { PwaLaunchRedirect } from "@/components/pwa/pwa-launch-redirect";
import { hexclaveServerApp } from "@/hexclave/server";

const SITE_URL = "https://campusloop.space";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CampusLoop — The Verified Digital Layer of College Life",
  description:
    "A verified student network for conversations, academics, events, communities, and everyday campus utilities across Indian colleges.",
  applicationName: "CampusLoop",
  authors: [{ name: "CampusLoop Team", url: `${SITE_URL}/about` }],
  keywords: [
    "CampusLoop",
    "campus social network India",
    "verified student network",
    "college community India",
    "campus communities",
    "college notes",
    "college PYQs",
    "campus events",
    "hackathons India",
    "campus marketplace",
    "student housing flatmates",
    "lost and found campus",
    "rideshare college",
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
    title: "CampusLoop — The Verified Digital Layer of College Life",
    description:
      "A verified student network for conversations, academics, events, communities, and everyday campus utilities across Indian colleges.",
    url: SITE_URL,
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "CampusLoop — The verified digital layer of college life",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop — The Verified Digital Layer of College Life",
    description:
      "A verified student network for conversations, academics, events, communities, and everyday campus utilities across Indian colleges.",
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
          "Verified digital campus platform for Indian college students with conversations, notes, PYQs, communities, events, and everyday campus utilities.",
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
              text: "Sign up with your college email domain (.ac.in, .edu, or recognized institution). You instantly unlock full access to your campus feed, notes, events, and communities.",
            },
          },
          {
            "@type": "Question",
            name: "Is anonymous posting really anonymous?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. When posting in anonymous mode, zero author identity is attached to the public payload. Even campus moderators cannot trace the author.",
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
              text: "Yes, completely free. Everything in the Academic Vault is uploaded, organized, and peer-reviewed by students for students.",
            },
          },
          {
            "@type": "Question",
            name: "Can I explore without an account first?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! You can explore in Viewer Mode to see campus trends, college hubs, events, and notes before creating an account.",
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

      {/* Accessibility Skip Link for Keyboard Users and Screen Readers */}
      <a
        href="#main-landing-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-primary focus:text-white focus:shadow-xl focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Skip to main campus content
      </a>

      {/* Floating Pill Navigation */}
      <MinimalLandingNavbar isAuthenticated={isAuthenticated} />

      {/* Semantic Screen-Reader & Search Engine Indexing Overview */}
      <section
        className="sr-only"
        aria-label="CampusLoop Platform Overview for Search Engines and Screen Readers"
      >
        <h2>
          CampusLoop — Verified Digital Campus Social Network and Student Utility Operating System in India
        </h2>
        <p>
          CampusLoop is India&apos;s verified college student social network and campus utility operating system,
          uniting students across 1,350+ universities and institutes including IIT Bombay, IIT Delhi, BITS Pilani,
          NIT Trichy, BIT Mesra, Delhi University, VIT Vellore, and SRM University.
        </p>
        <p>
          Key Platform Modules &amp; Student Capabilities:
        </p>
        <ul>
          <li>
            <strong>100% Institutional Verification:</strong> Student accounts are authenticated through official
            university email domains (.ac.in and .edu) with zero non-student commercial bots or recruiters.
          </li>
          <li>
            <strong>Dual Campus Persona &amp; Anonymity:</strong> Toggle between zero-log anonymous campus confessions
            with cryptographic identity escrow and verified student profiles with Loop Points (LP).
          </li>
          <li>
            <strong>Academic Vault:</strong> Free peer-reviewed lecture notes, module guides, handwritten exam cheatsheets,
            and 5-year solved previous year question papers (PYQs) for engineering, medicine, management, and arts courses.
          </li>
          <li>
            <strong>Student Utilities &amp; Peer Trade:</strong> Verified student-to-student marketplace for buying and selling
            bicycles, dorm coolers, textbooks, and hostel mattresses; student housing and roommate finder near campus gates;
            lost and found item recovery registry; and shared auto and cab rideshare pooling.
          </li>
          <li>
            <strong>Campus Communities &amp; Events:</strong> Discover campus clubs, student chapters (ACM, IEEE, GDSC, Robotics),
            hackathon squads, college fests, workshops, and RSVP for live events.
          </li>
          <li>
            <strong>Aspirant Viewer Mode:</strong> Read-only access for JEE Main, JEE Advanced, NEET, and CUET college
            aspirants to explore authentic student culture and verified reviews before admission.
          </li>
        </ul>
      </section>

      {/* Main Coherent Mobile-First Product Flow */}
      <main id="main-landing-content" className="flex-1">
        <CleanHero isAuthenticated={isAuthenticated} />
        <CampusTicker />
        <CampusUtilityMatrix />
        <InteractiveShowcase />
        <CleanWorkflow />
        <InteractivePersonaFlip />
        <AcademicsQuickVault />
        <CampusLoopGraph />
        <CleanFAQ />
        <CleanCTA isAuthenticated={isAuthenticated} />
      </main>

      {/* Categorized Clean Footer */}
      <CleanFooter />

      {/* Mobile-Only Floating Action Dock */}
      <MobileStickyBar isAuthenticated={isAuthenticated} />
    </div>
  );
}
