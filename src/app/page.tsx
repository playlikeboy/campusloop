
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CampusLoopHomepageRefresh, LANDING_FAQS } from "@/components/landing/campusloop-homepage-refresh";
import { getBrowseRows } from "@/lib/courses/server";
import { PwaLaunchRedirect } from "@/components/pwa/pwa-launch-redirect";
import { hexclaveServerApp } from "@/hexclave/server";

const SITE_URL = "https://campusloop.space";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { absolute: "CampusLoop — All of College. One App." },
  description:
    "The everything app for your college life: a real campus feed, confessions, communities & clubs, campus match, events, free courses, notes and PYQs — all in one place for 1,400+ Indian colleges. Join free.",
  applicationName: "CampusLoop",
  authors: [{ name: "CampusLoop Team", url: SITE_URL + "/about" }],
  keywords: ["CampusLoop", "college social network India", "campus community app", "college confessions app", "campus match dating", "college clubs and communities", "college events", "verified student network", "free online courses", "college notes and PYQs"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
  openGraph: {
    title: "CampusLoop: All of college. One app.",
    description: "Your real campus feed, confessions, communities, campus match and events — plus free courses, notes and PYQs. Everything about college, in one verified-students app.",
    url: SITE_URL, siteName: "CampusLoop", locale: "en_IN", type: "website",
    images: [{ url: SITE_URL + "/campusloop/marketing/voxel/social-preview.webp", width: 1200, height: 630, alt: "CampusLoop — a connected home for college life" }],
  },
  twitter: {
    card: "summary_large_image", title: "CampusLoop: All of college. One app.",
    description: "Your campus feed, confessions, communities, campus match & events — plus free courses, notes and PYQs.",
    creator: "@mycampusloop", images: [SITE_URL + "/campusloop/marketing/voxel/social-preview.webp"],
  },
};

export default async function LandingPage() {
  const user = await hexclaveServerApp.getUser();
  if (user) redirect("/feeds");

  // Real catalog picks for the courses section; the page still renders if the catalog is unreachable.
  const browse = await getBrowseRows().catch(() => null);
  const showcase = browse?.rows.find((r) => r.key === "universities")?.courses ?? browse?.rows[0]?.courses ?? [];
  const courseTotal = browse?.categories.reduce((a, c) => a + c.count, 0) ?? 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization", "@id": SITE_URL + "/#organization", name: "CampusLoop", url: SITE_URL,
        logo: SITE_URL + "/logo.png",
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
        description: "A student-only campus network with free video courses and certificates, academic notes and PYQs, peer conversations, student communities, college hubs and campus match.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      },
      {
        "@type": "ItemList", "@id": SITE_URL + "/#courses", name: "Free courses on CampusLoop",
        itemListElement: showcase.slice(0, 8).map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/courses/${c.slug}`, name: c.title })),
      },
      {
        "@type": "FAQPage", "@id": SITE_URL + "/#faq",
        mainEntity: LANDING_FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
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
      <CampusLoopHomepageRefresh courses={showcase} courseTotal={courseTotal} />
    </>
  );
}
