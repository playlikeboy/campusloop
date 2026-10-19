import { ArrowLeft, ArrowRight, BookOpen, Check, ExternalLink, LineChart, Lightbulb, Lock, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CTABand, MarketingFooter, MarketingHeader } from "@/components/marketing/system";
import { GUIDES, getGuide, getGuideSlugs, SITE_URL } from "@/lib/guide";

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const url = `${SITE_URL}/guide/${g.slug}`;
  return {
    title: `${g.title}: how to use it and why — CampusLoop Guide`,
    description: `${g.summary} ${g.purpose}`.slice(0, 300),
    keywords: g.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${g.title} — CampusLoop Guide`,
      description: g.summary,
      url,
      siteName: "CampusLoop",
      type: "article",
      locale: "en_IN",
      modifiedTime: g.updated,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: g.title }],
    },
    twitter: { card: "summary_large_image", title: `${g.title} — CampusLoop Guide`, description: g.summary },
    robots: { index: true, follow: true },
  };
}

function Block({ id, title, icon: Icon, children }: { id: string; title: string; icon: typeof Check; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Icon className="size-5 text-primary" aria-hidden />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const idx = GUIDES.findIndex((x) => x.slug === g.slug);
  const prev = GUIDES[idx - 1];
  const next = GUIDES[idx + 1];
  const related = g.related.map((r) => getGuide(r)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const url = `${SITE_URL}/guide/${g.slug}`;
  const appRoutes = g.routes.filter((r) => !r.path.includes("["));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use ${g.title} on CampusLoop`,
      description: g.summary,
      url,
      dateModified: g.updated,
      step: g.howToUse.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Guide", item: `${SITE_URL}/guide` },
        { "@type": "ListItem", position: 2, name: g.title, item: url },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
        <MarketingHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/guide" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="size-3.5" aria-hidden /> Guide
            </Link>
            <span aria-hidden>/</span>
            <span>{g.category}</span>
          </nav>

          <header className="mt-6">
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">{g.title}</h1>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{g.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              {g.audiences.map((a) => (
                <span key={a} className="rounded-full bg-muted/70 px-3 py-1 font-semibold text-muted-foreground">
                  {a}
                </span>
              ))}
              <span className="text-muted-foreground">Updated {g.updated}</span>
            </div>
            {appRoutes.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {appRoutes.slice(0, 4).map((r) => (
                  <Link
                    key={r.path}
                    href={r.path}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary/10 px-4 text-sm font-semibold text-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Open {r.label} <ExternalLink className="size-3.5" aria-hidden />
                  </Link>
                ))}
              </div>
            )}
          </header>

          <Block id="purpose" title="Why it exists" icon={Lightbulb}>
            <p className="leading-relaxed text-muted-foreground">{g.purpose}</p>
          </Block>

          <Block id="why" title="Why use it" icon={Check}>
            <ul className="space-y-2">
              {g.whyUse.map((w) => (
                <li key={w} className="flex gap-2.5 leading-relaxed text-foreground">
                  <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                  {w}
                </li>
              ))}
            </ul>
          </Block>

          <Block id="how" title="How to use it" icon={BookOpen}>
            <ol className="space-y-3">
              {g.howToUse.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed text-foreground">{step}</span>
                </li>
              ))}
            </ol>
            {g.tips && g.tips.length > 0 && (
              <div className="mt-5 rounded-2xl bg-muted/50 p-4">
                <p className="text-sm font-semibold text-foreground">Tips</p>
                <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                  {g.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </Block>

          <Block id="cases" title="Use cases" icon={Users}>
            <ul className="grid gap-2 sm:grid-cols-2">
              {g.useCases.map((u) => (
                <li key={u.scenario} className="rounded-2xl bg-card/60 p-4 shadow-2xs">
                  <p className="text-sm font-semibold text-foreground">{u.who}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{u.scenario}</p>
                </li>
              ))}
            </ul>
          </Block>

          {g.privacy && g.privacy.length > 0 && (
            <Block id="privacy" title="Privacy" icon={Lock}>
              <ul className="space-y-2 text-muted-foreground">
                {g.privacy.map((p) => (
                  <li key={p} className="leading-relaxed">{p}</li>
                ))}
              </ul>
            </Block>
          )}

          <Block id="value" title="Why it matters (for investors)" icon={LineChart}>
            <p className="leading-relaxed text-muted-foreground">{g.investorAngle}</p>
          </Block>

          <section aria-labelledby="faq" className="mt-12">
            <h2 id="faq" className="text-xl font-bold text-foreground">Questions</h2>
            <dl className="mt-3 space-y-4">
              {g.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1 leading-relaxed text-muted-foreground">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {(related.length > 0 || g.essaySlug) && (
            <section aria-labelledby="related" className="mt-12">
              <h2 id="related" className="text-xl font-bold text-foreground">Related</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/guide/${r.slug}`} className="block rounded-2xl bg-card/60 p-4 shadow-2xs hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="font-semibold text-foreground">{r.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{r.summary}</span>
                    </Link>
                  </li>
                ))}
                {g.essaySlug && (
                  <li>
                    <Link href={`/docs/${g.essaySlug}`} className="block rounded-2xl bg-card/60 p-4 shadow-2xs hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <span className="font-semibold text-foreground">Deep dive: the engineering essay</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">How {g.title} is built and why.</span>
                    </Link>
                  </li>
                )}
              </ul>
            </section>
          )}

          <nav aria-label="More guides" className="mt-14 grid grid-cols-2 gap-3 border-t border-border/60 pt-6 text-sm">
            {prev ? (
              <Link href={`/guide/${prev.slug}`} className="rounded-xl p-2 hover:bg-muted/60">
                <span className="flex items-center gap-1 text-muted-foreground"><ArrowLeft className="size-3.5" aria-hidden /> Previous</span>
                <span className="font-semibold text-foreground">{prev.title}</span>
              </Link>
            ) : <span />}
            {next && (
              <Link href={`/guide/${next.slug}`} className="rounded-xl p-2 text-right hover:bg-muted/60">
                <span className="flex items-center justify-end gap-1 text-muted-foreground">Next <ArrowRight className="size-3.5" aria-hidden /></span>
                <span className="font-semibold text-foreground">{next.title}</span>
              </Link>
            )}
          </nav>
        </main>
        <CTABand
          title={`Try ${g.title} on your campus.`}
          lede="Free for verified students."
          primaryHref="/sign-up"
          primaryLabel="Join free"
          secondaryHref="/guide"
          secondaryLabel="All features"
        />
        <MarketingFooter />
      </div>
    </>
  );
}
