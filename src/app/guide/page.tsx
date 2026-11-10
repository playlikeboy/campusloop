import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { GuideHubClient } from "@/components/guide/guide-hub-client";
import { PageIntro } from "@/components/marketing/page-hero";
import { CTABand } from "@/components/marketing/system";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { GUIDE_CATEGORIES, GUIDES, PRODUCT_OVERVIEW } from "@/lib/guide";
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const metadata = buildMetadata({
  title: "Guide",
  description:
    "Step-by-step help for every CampusLoop feature: feed, confessions, chat, Campus Match, clubs, events, notes, marketplace and privacy.",
  path: "/guide",
});

const START = ["getting-started", "campus-feed", "academic-vault", "campus-match"];

export default function GuideHubPage() {
  const startGuides = START.map((s) => GUIDES.find((g) => g.slug === s)).filter(
    (g): g is (typeof GUIDES)[number] => Boolean(g)
  );

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "CollectionPage",
            name: "CampusLoop Guide",
            url: `${SITE_URL}/guide`,
            description: PRODUCT_OVERVIEW.oneLiner,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: GUIDES.map((g, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: g.title,
                url: `${SITE_URL}/guide/${g.slug}`,
              })),
            },
          },
          breadcrumbJsonLd([{ name: "Guide", path: "/guide" }]),
        ]}
      />
      <div className="mx-auto w-full max-w-3xl px-[var(--gutter)] py-12 sm:py-16">
        <PageIntro title="How to use CampusLoop" lede="Short, step-by-step guides for every feature." />

        <section aria-labelledby="start" className="mt-10">
          <h2 id="start" className="text-2xl text-fg">
            New here? Start with these
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {startGuides.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guide/${g.slug}`}
                  className="group flex min-h-14 items-center justify-between gap-3 rounded-lg bg-brand-subtle px-4 py-3 font-semibold text-brand-text transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {g.title}
                  <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="all" className="mt-14">
          <h2 id="all" className="mb-4 text-2xl text-fg">
            All guides
          </h2>
          <GuideHubClient
            categories={GUIDE_CATEGORIES}
            guides={GUIDES.map(({ slug, title, summary, category, keywords }) => ({
              slug,
              title,
              summary,
              category,
              keywords,
            }))}
          />
        </section>

        <p className="mt-12 text-sm text-fg-subtle">
          Using an AI assistant? The whole guide is also available as{" "}
          <a
            href="/llms-full.txt"
            className="text-brand-text underline underline-offset-4 hover:no-underline"
          >
            plain text
          </a>
          . Investors can start at{" "}
          <Link href="/investors" className="text-brand-text underline underline-offset-4 hover:no-underline">
            the investor page
          </Link>
          .
        </p>
      </div>
      <CTABand
        title="Try it on your campus."
        lede="Join with your college email. It takes a minute."
        primaryHref="/sign-up"
        primaryLabel="Join with college email"
        secondaryHref="/colleges"
        secondaryLabel="Find your college"
      />
    </MarketingShell>
  );
}
