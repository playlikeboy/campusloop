import Link from "next/link";
import { PageIntro } from "@/components/marketing/page-hero";
import { CTABand } from "@/components/marketing/system";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { buttonVariants } from "@/components/ui/button";
import { GUIDE_CATEGORIES, getGuidesByCategory, INVESTOR_POINTS, PRODUCT_OVERVIEW } from "@/lib/guide";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const metadata = buildMetadata({
  title: "Investors",
  description:
    "CampusLoop is a student-only app for Indian colleges, started at BIT Mesra. The problem, the product, how it makes money and how it grows.",
  path: "/investors",
});

function PointList({ id, title, items }: { id: string; title: string; items: string[] }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-2xl text-fg">
        {title}
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-fg-muted marker:text-fg-subtle">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function InvestorsPage() {
  const i = INVESTOR_POINTS;
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Investors", path: "/investors" }])} />
      <div className="mx-auto w-full max-w-3xl px-[var(--gutter)] py-12 sm:py-16">
        <PageIntro
          title="CampusLoop for investors"
          lede={i.solution}
          meta="Started at BIT Mesra by Shaswat Raj."
        >
          <div className="flex flex-wrap gap-3">
            <Link href="/pitch" className={buttonVariants()}>
              See the pitch deck
            </Link>
            <Link href="/contact" className={buttonVariants({ variant: "outline" })}>
              Talk to the team
            </Link>
          </div>
        </PageIntro>

        <div className="mt-14 space-y-12 text-base">
          <section aria-labelledby="problem">
            <h2 id="problem" className="text-2xl text-fg">
              The problem
            </h2>
            <p className="mt-3 text-fg-muted">{i.problem}</p>
            <p className="mt-3 text-fg-muted">{PRODUCT_OVERVIEW.why}</p>
          </section>

          <PointList id="moats" title="Why it's hard to copy" items={i.moats} />
          <PointList id="revenue" title="How it makes money" items={i.revenue} />
          <PointList id="growth" title="How it grows" items={i.growth} />

          <section aria-labelledby="measure">
            <h2 id="measure" className="text-2xl text-fg">
              How we decide
            </h2>
            <p className="mt-3 text-fg-muted">{i.measurement}</p>
            <p className="mt-3 text-sm text-fg-subtle">Built with: {PRODUCT_OVERVIEW.stack}</p>
          </section>

          <section aria-labelledby="map">
            <h2 id="map" className="text-2xl text-fg">
              Every feature, and why it matters
            </h2>
            <div className="mt-6 space-y-8">
              {GUIDE_CATEGORIES.map((c) => (
                <div key={c.name}>
                  <h3 className="font-sans text-sm font-semibold text-fg-subtle">{c.name}</h3>
                  <ul className="mt-2 divide-y divide-border">
                    {getGuidesByCategory(c.name).map((g) => (
                      <li key={g.slug}>
                        <Link
                          href={`/guide/${g.slug}#value`}
                          className="block py-3 transition-ui hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="block font-semibold text-fg">{g.title}</span>
                          <span className="block text-sm text-fg-muted">{g.investorAngle}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <CTABand
        title="Want to see it live?"
        lede="We'll walk you through the product."
        primaryHref="/contact"
        primaryLabel="Contact us"
        secondaryHref="/demo"
        secondaryLabel="Try the demo account"
      />
    </MarketingShell>
  );
}
