import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { PwaLaunchRedirect } from "@/components/pwa/pwa-launch-redirect";
import { FOUNDER, LANDING_FAQS, SITE_URL, SOCIAL_LINKS } from "@/constants/landing";
import { getBrowseRows } from "@/lib/courses/server";
import { getPublicStats } from "@/lib/public-stats";
import { hexclaveServerApp } from "@/hexclave/server";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { absolute: "CampusLoop: All of college. One app." },
  description:
    "A verified, student-only campus network for Indian colleges: your campus feed, anonymous confessions, clubs and communities, Campus Match for 18+, events, and notes and past papers. Join with your college email.",
  applicationName: "CampusLoop",
  authors: [{ name: FOUNDER.name, url: SITE_URL + "/about" }],
  keywords: ["CampusLoop", "college social network India", "campus community app", "college confessions app", "campus match", "college clubs and communities", "college events", "verified student network", "college notes and PYQs", "free online courses"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
  openGraph: {
    title: "CampusLoop: All of college. One app.",
    description: "Your campus feed, confessions, clubs, Campus Match and events, plus notes, past papers and free courses. For verified students only.",
    url: SITE_URL, siteName: "CampusLoop", locale: "en_IN", type: "website",
    images: [{ url: SITE_URL + "/campusloop/marketing/voxel/social-preview.webp", width: 1200, height: 630, alt: "CampusLoop, the verified campus network" }],
  },
  twitter: {
    card: "summary_large_image", title: "CampusLoop: All of college. One app.",
    description: "Your campus feed, confessions, clubs, Campus Match and events, plus notes, past papers and free courses. For verified students only.",
    creator: "@mycampusloop", images: [SITE_URL + "/campusloop/marketing/voxel/social-preview.webp"],
  },
};

export default async function HomePage() {
  const user = await hexclaveServerApp.getUser();
  if (user) redirect("/feeds");

  // Real catalog picks for the vault section; the page still renders if the catalog is unreachable.
  const [browse, stats] = await Promise.all([getBrowseRows().catch(() => null), getPublicStats()]);
  const showcase = browse?.rows.find((r) => r.key === "universities")?.courses ?? browse?.rows[0]?.courses ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization", "@id": SITE_URL + "/#organization", name: "CampusLoop", url: SITE_URL,
        logo: SITE_URL + "/logo.png",
        founder: { "@type": "Person", name: FOUNDER.name },
        sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.linkedin, SOCIAL_LINKS.x],
      },
      {
        "@type": "WebSite", "@id": SITE_URL + "/#website", url: SITE_URL, name: "CampusLoop",
        publisher: { "@id": SITE_URL + "/#organization" }, inLanguage: "en-IN",
      },
      {
        "@type": "WebApplication", "@id": SITE_URL + "/#software", name: "CampusLoop", url: SITE_URL,
        applicationCategory: "SocialNetworkingApplication", operatingSystem: "Web",
        description: "A verified, student-only campus network for Indian colleges: campus feed, anonymous confessions, communities and clubs, Campus Match for students aged 18 and over, events, notes, past papers and free courses.",
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
    <MarketingShell>
      <PwaLaunchRedirect />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPage courses={showcase} stats={stats} />
    </MarketingShell>
  );
}
