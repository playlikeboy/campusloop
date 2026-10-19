import { ArrowRight, Bot, LineChart, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { GuideHubClient } from "@/components/guide/guide-hub-client";
import { CTABand, MarketingFooter, MarketingHeader } from "@/components/marketing/system";
import { GUIDE_CATEGORIES, GUIDES, PRODUCT_OVERVIEW, SITE_URL } from "@/lib/guide";

export const metadata: Metadata = {
  title: "CampusLoop Product Guide — Every Feature Explained",
  description:
    "How to use every CampusLoop feature, why it exists and who it is for: feed, confessions, chat, Campus Match, communities, events, Academic Vault, marketplace, payments, privacy and more.",
  alternates: { canonical: `${SITE_URL}/guide` },
  openGraph: {
    title: "CampusLoop Product Guide",
    description: "Every feature, how to use it, why, and real use cases.",
    url: `${SITE_URL}/guide`,
    siteName: "CampusLoop",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "CampusLoop Product Guide" }],
  },
  twitter: { card: "summary_large_image", title: "CampusLoop Product Guide", images: [`${SITE_URL}/og-image.png`] },
  robots: { index: true, follow: true },
};

const START = ["getting-started", "campus-feed", "academic-vault", "campus-match"];

export default function GuideHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "CampusLoop Product Guide",
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
  };

  const startGuides = START.map((s) => GUIDES.find((g) => g.slug === s)).filter((g): g is (typeof GUIDES)[number] => Boolean(g));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
        <MarketingHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
          <header className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">Product Guide</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
              Everything CampusLoop does, and how to use it.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{PRODUCT_OVERVIEW.what}</p>
          </header>

          <section aria-labelledby="why" className="mt-12 grid gap-8 sm:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 id="why" className="text-xl font-bold text-foreground">Why it exists</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{PRODUCT_OVERVIEW.why}</p>
              <h3 className="mt-6 text-sm font-semibold text-foreground">Built on five principles</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {PRODUCT_OVERVIEW.principles.map((p) => (
                  <li key={p} className="flex gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-card/60 p-5 shadow-2xs">
              <h2 className="text-sm font-semibold text-foreground">New here? Start with these</h2>
              <ol className="mt-3 space-y-1">
                {startGuides.map((g, i) => (
                  <li key={g.slug}>
                    <Link
                      href={`/guide/${g.slug}`}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium text-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ol>
              <div className="mt-4 space-y-1 border-t border-border/60 pt-4 text-sm">
                <Link href="/investors" className="flex min-h-10 items-center gap-2 rounded-xl px-2 font-medium text-foreground hover:bg-muted/70">
                  <LineChart className="size-4 text-muted-foreground" aria-hidden /> For investors
                  <ArrowRight className="ml-auto size-4 text-muted-foreground" aria-hidden />
                </Link>
                <a href="/llms-full.txt" className="flex min-h-10 items-center gap-2 rounded-xl px-2 font-medium text-foreground hover:bg-muted/70">
                  <Bot className="size-4 text-muted-foreground" aria-hidden /> Whole app as plain text (for AI)
                  <ArrowRight className="ml-auto size-4 text-muted-foreground" aria-hidden />
                </a>
              </div>
            </div>
          </section>

          <section aria-labelledby="all" className="mt-16">
            <h2 id="all" className="mb-4 text-2xl font-bold text-foreground">
              All {GUIDES.length} features
            </h2>
            <GuideHubClient
              categories={GUIDE_CATEGORIES}
              guides={GUIDES.map(({ slug, title, summary, category, keywords }) => ({ slug, title, summary, category, keywords }))}
            />
          </section>
        </main>
        <CTABand
          title="See it on your own campus."
          lede="Join with your college email. It takes under a minute."
          primaryHref="/sign-up"
          primaryLabel="Join free"
          secondaryHref="/colleges"
          secondaryLabel="Find your college"
        />
        <MarketingFooter />
      </div>
    </>
  );
}
