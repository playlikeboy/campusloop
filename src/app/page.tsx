import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CleanFooter } from "@/components/landing/clean-footer";
import { CuteLandingNavbar } from "@/components/landing/cute-landing-navbar";
import { CuteLandingHero } from "@/components/landing/cute-landing-hero";
import { CuteFeaturesBento } from "@/components/landing/cute-features-bento";
import { CuteDailyRush } from "@/components/landing/cute-daily-rush";
import { CuteStreaksSection } from "@/components/landing/cute-streaks-section";
import { CuteStudentVoices } from "@/components/landing/cute-student-voices";
import { CuteLandingFAQ } from "@/components/landing/cute-landing-faq";
import { CuteLandingCTA } from "@/components/landing/cute-landing-cta";
import { PwaLaunchRedirect } from "@/components/pwa/pwa-launch-redirect";
import { hexclaveServerApp } from "@/hexclave/server";

const SITE_URL = "https://campusloop.space";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CampusLoop — Where Your Campus Actually Talks | One Connected Digital Home",
  description:
    "Where your campus actually talks. One connected digital home for college life in India. Verified student discussions, peer-curated lecture notes & solved PYQs, campus communities, and student match across 1,350+ universities.",
  applicationName: "CampusLoop",
  authors: [{ name: "CampusLoop Team", url: `${SITE_URL}/about` }],
  keywords: [
    "CampusLoop",
    "where campus talks",
    "verified student network",
    "college community India",
    "academic notes",
    "college PYQs",
    "campus match",
    "college clubs",
    "student discussions",
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
    title: "CampusLoop — Where Your Campus Actually Talks",
    description:
      "Where your campus actually talks. One connected digital home for college life in India. Verified peer discussions, peer-curated academic notes, semester PYQs, and student communities.",
    url: SITE_URL,
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/campusloop/marketing/voxel/social-preview.webp`,
        width: 1200,
        height: 630,
        alt: "CampusLoop — Where Your Campus Actually Talks (Verified Student Network)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop — Where Your Campus Actually Talks",
    description:
      "Where your campus actually talks. One connected digital home for college life in India. Verified peer discussions, 45,000+ notes & solved PYQs, and campus communities.",
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
          "https://www.linkedin.com/company/mycampusloop/?viewAsMember=true",
          "https://x.com/company/mycampusloop/",
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
            name: "How does student verification work, and what if my college isn't indexed yet?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can verify your student status using your official institutional email (.ac.in, .edu, or college domain) or by uploading a photo of your student ID card. If your college is not yet indexed in our 1,350+ directory, you can submit an instant Hub Request at /college-request.",
            },
          },
          {
            "@type": "Question",
            name: "How does anonymous posting work, and how is safety maintained?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "When you post in anonymous discussion spaces, your identity is cryptographically decoupled on the server before database persistence, ensuring complete privacy. Our automated Agatha safety filter screens for doxxing, harassment, and harmful keywords in real time.",
            },
          },
          {
            "@type": "Question",
            name: "How do I access the Academic Vault, and is it really 100% free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, the Academic Vault is 100% free with zero paywalls. Any verified student can browse, search, and download thousands of peer-curated handwritten notes, syllabus roadmaps, and solved previous year question papers (PYQs).",
            },
          },
          {
            "@type": "Question",
            name: "Do professors, deans, or college administrations monitor discussions?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. CampusLoop is an independent, student-first platform. College administrations, faculty members, and corporate recruiters have zero administrative privileges or access to private student hubs.",
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

      {/* Cute Floating Header */}
      <CuteLandingNavbar isAuthenticated={isAuthenticated} />

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
        <CuteLandingHero isAuthenticated={isAuthenticated} />
        <CuteFeaturesBento />
        <CuteDailyRush />
        <CuteStreaksSection />
        <CuteStudentVoices />
        <CuteLandingFAQ />
        <CuteLandingCTA isAuthenticated={isAuthenticated} />
      </main>

      {/* Footer */}
      <CleanFooter />
    </div>
  );
}
