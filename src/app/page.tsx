
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CampusLoopHomepageRefresh } from "@/components/landing/campusloop-homepage-refresh";
import { PwaLaunchRedirect } from "@/components/pwa/pwa-launch-redirect";
import { hexclaveServerApp } from "@/hexclave/server";

const SITE_URL = "https://campusloop.space";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CampusLoop — Your Campus. Your People.",
  description: "Meet verified classmates, find free study notes and solved PYQs, discover student communities, and keep up with campus life in one place.",
  applicationName: "CampusLoop",
  authors: [{ name: "CampusLoop Team", url: SITE_URL + "/about" }],
  keywords: ["CampusLoop", "verified student network", "college community India", "academic notes", "college PYQs", "campus match", "college clubs", "student discussions"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
  openGraph: {
    title: "CampusLoop — Your Campus. Your People.",
    description: "A student-only space for campus conversations, free study resources, communities, and new connections.",
    url: SITE_URL, siteName: "CampusLoop", locale: "en_IN", type: "website",
    images: [{ url: SITE_URL + "/campusloop/marketing/voxel/social-preview.webp", width: 1200, height: 630, alt: "CampusLoop — a connected home for college life" }],
  },
  twitter: {
    card: "summary_large_image", title: "CampusLoop — Your Campus. Your People.",
    description: "Campus conversations, free study resources, and student communities in one place.",
    creator: "@mycampusloop", images: [SITE_URL + "/campusloop/marketing/voxel/social-preview.webp"],
  },
};

export default async function LandingPage() {
  const user = await hexclaveServerApp.getUser();
  if (user) redirect("/feeds");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization", "@id": SITE_URL + "/#organization", name: "CampusLoop", url: SITE_URL,
        logo: SITE_URL + "/campusloop/marketing/voxel/logo.png",
        sameAs: ["https://www.instagram.com/campusloop.space/", "https://www.linkedin.com/company/mycampusloop/?viewAsMember=true", "https://x.com/company/mycampusloop/"],
      },
      {
        "@type": "WebSite",
        "@id": SITE_URL + "/#website",
        url: SITE_URL,
        name: "CampusLoop",
        publisher: { "@id": SITE_URL + "/#organization" },
        inLanguage: "en-IN",
      },
      {
        "@type": "WebApplication", "@id": SITE_URL + "/#software", name: "CampusLoop", url: SITE_URL,
        applicationCategory: "SocialNetworkingApplication", operatingSystem: "Web",
        description: "A student-only campus network with peer conversations, academic notes, student communities, college hubs, and campus match.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      },
      {
        "@type": "FAQPage", "@id": SITE_URL + "/#faq",
        mainEntity: [
          { "@type": "Question", name: "Who can join CampusLoop?", acceptedAnswer: { "@type": "Answer", text: "CampusLoop is for college students. Sign up with your institutional email or use the supported student-ID verification flow." } },
          { "@type": "Question", name: "Is the Academic Vault free?", acceptedAnswer: { "@type": "Answer", text: "Students can browse and access available peer-shared notes and previous-year question papers without a paywall." } },
          { "@type": "Question", name: "What if my college isn’t listed?", acceptedAnswer: { "@type": "Answer", text: "Visit the college directory to check existing hubs or request a hub for your institution." } },
        ],
      },
    ],
  };

  return (
    <>
      <PwaLaunchRedirect />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a href="#main-landing-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-3 focus:font-bold focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring">
        Skip to main content
      </a>
      <CampusLoopHomepageRefresh />
    </>
  );
}
