import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FAQS } from "@/components/landing/landing-copy";
import { LandingPage } from "@/components/landing/landing-page";
import { PwaLaunchRedirect } from "@/components/pwa/pwa-launch-redirect";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { hexclaveServerApp } from "@/hexclave/server";
import { getBrowseRows } from "@/lib/courses/server";
import { getPublicStats } from "@/lib/public-stats";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

const DESCRIPTION =
  "A social app for Indian college students. Confessions, polls, events, clubs and notes from your own college. Join free with your college email.";

const base = buildMetadata({
  title: "CampusLoop: Your campus. Only your campus.",
  absoluteTitle: true,
  description: DESCRIPTION,
  path: "/",
});

export const metadata: Metadata = {
  ...base,
  applicationName: "CampusLoop",
  alternates: { ...base.alternates, types: { "application/rss+xml": "/feed.xml" } },
};

export default async function HomePage() {
  const user = await hexclaveServerApp.getUser();
  if (user) redirect("/feeds");

  // Real catalog picks; the page still renders if the catalog is unreachable.
  const [browse, stats] = await Promise.all([getBrowseRows().catch(() => null), getPublicStats()]);
  const showcase =
    browse?.rows.find((r) => r.key === "universities")?.courses ?? browse?.rows[0]?.courses ?? [];

  const jsonLd = [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: "CampusLoop",
      url: SITE_URL,
      applicationCategory: "SocialNetworkingApplication",
      operatingSystem: "Web",
      description: DESCRIPTION,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQS.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
    ...(showcase.length > 0
      ? [
          {
            "@type": "ItemList",
            "@id": `${SITE_URL}/#courses`,
            name: "Free courses on CampusLoop",
            itemListElement: showcase.slice(0, 3).map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}/courses/${c.slug}`,
              name: c.title,
            })),
          },
        ]
      : []),
  ];

  return (
    <MarketingShell>
      <PwaLaunchRedirect />
      <JsonLd data={jsonLd} />
      <LandingPage courses={showcase} stats={stats} />
    </MarketingShell>
  );
}
