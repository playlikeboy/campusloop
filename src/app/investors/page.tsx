import { ArrowRight, Check, LineChart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CTABand, MarketingFooter, MarketingHeader } from "@/components/marketing/system";
import { GUIDE_CATEGORIES, GUIDES, getGuidesByCategory, INVESTOR_POINTS, PRODUCT_OVERVIEW, SITE_URL } from "@/lib/guide";

export const metadata: Metadata = {
  title: "CampusLoop for Investors — Problem, Product, Moats and Revenue",
  description:
    "CampusLoop is a verified student-only network and campus super-app for Indian colleges. The problem, the product, why it is defensible, how it makes money and how it grows.",
  alternates: { canonical: `${SITE_URL}/investors` },
  openGraph: {
    title: "CampusLoop for Investors",
    description: PRODUCT_OVERVIEW.oneLiner,
    url: `${SITE_URL}/investors`,
    siteName: "CampusLoop",
    type: "website",
    locale: "en_IN",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "CampusLoop for Investors" }],
  },
  robots: { index: true, follow: true },
};

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl bg-card/60 p-5 shadow-2xs">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {i}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function InvestorsPage() {
  const i = INVESTOR_POINTS;
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
        <header className="max-w-3xl">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <LineChart className="size-4" aria-hidden /> For investors
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl sm:leading-[1.08]">{PRODUCT_OVERVIEW.oneLiner}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{i.solution}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/pitch" className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              View the pitch deck <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/guide" className="inline-flex h-11 items-center rounded-full bg-muted/70 px-5 text-sm font-semibold text-foreground hover:bg-muted">
              Read the product guide
            </Link>
          </div>
        </header>

        <section aria-labelledby="problem" className="mt-14 max-w-3xl">
          <h2 id="problem" className="text-2xl font-bold">The problem</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{i.problem}</p>
          <p className="mt-3 leading-relaxed text-muted-foreground">{PRODUCT_OVERVIEW.why}</p>
        </section>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          <List title="Why it is defensible" items={i.moats} />
          <List title="How it makes money" items={i.revenue} />
          <List title="How it grows" items={i.growth} />
        </div>

        <section aria-labelledby="measure" className="mt-10 max-w-3xl">
          <h2 id="measure" className="text-2xl font-bold">Measured, not guessed</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{i.measurement}</p>
          <h3 className="mt-6 text-sm font-semibold">Technology</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{PRODUCT_OVERVIEW.stack}</p>
        </section>

        <section aria-labelledby="map" className="mt-14">
          <h2 id="map" className="text-2xl font-bold">The product, feature by feature</h2>
          <p className="mt-1 text-muted-foreground">{GUIDES.length} features. Each links to how it works and why it matters.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {GUIDE_CATEGORIES.map((c) => (
              <div key={c.name}>
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <ul className="mt-2 space-y-1">
                  {getGuidesByCategory(c.name).map((g) => (
                    <li key={g.slug}>
                      <Link href={`/guide/${g.slug}#value`} className="group block rounded-xl px-2 py-1.5 hover:bg-muted/60">
                        <span className="text-sm font-medium text-foreground">{g.title}</span>
                        <span className="block text-xs leading-relaxed text-muted-foreground">{g.investorAngle}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
      <CTABand
        title="Talk to the team."
        lede="We would love to show you the product live."
        primaryHref="/contact"
        primaryLabel="Contact us"
        secondaryHref="/pitch"
        secondaryLabel="Pitch deck"
      />
      <MarketingFooter />
    </div>
  );
}
