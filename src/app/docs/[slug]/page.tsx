import { ArrowLeft, ArrowRight, Check, Clock, ListChecks, Quote, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsFeatureIcon } from "@/components/docs/docs-feature-icon";
import { DocsShareToolbar } from "@/components/docs/docs-share-toolbar";
import { CTABand } from "@/components/marketing/system";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { hexclaveServerApp } from "@/hexclave/server";
import { DOCS_FEATURES, getDocsFeature, getDocsSlugs } from "@/lib/docs-features";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDocsSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const feature = getDocsFeature(slug);
  if (!feature) notFound();
  const url = `https://campusloop.space/docs/${feature.slug}`;
  return {
    title: `${feature.title} · CampusLoop`,
    description: feature.description,
    keywords: feature.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${feature.title}: ${feature.tagline}`,
      description: feature.description,
      url,
      siteName: "CampusLoop Engineering Docs",
      locale: "en_IN",
      type: "article",
      images: [
        {
          url: "https://campusloop.space/og-image.png",
          width: 1200,
          height: 630,
          alt: `${feature.title} — CampusLoop Engineering Docs`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${feature.title}: ${feature.tagline}`,
      description: feature.description,
      images: ["https://campusloop.space/og-image.png"],
    },
    robots: { index: true, follow: true },
  };
}

export default async function DocsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = getDocsFeature(slug);
  if (!feature) notFound();
  const user = await hexclaveServerApp.getUser();

  const idx = DOCS_FEATURES.findIndex((f) => f.slug === feature.slug);
  const prev = DOCS_FEATURES[(idx - 1 + DOCS_FEATURES.length) % DOCS_FEATURES.length];
  const next = DOCS_FEATURES[(idx + 1) % DOCS_FEATURES.length];
  const related = DOCS_FEATURES.filter(
    (f) => f.category === feature.category && f.slug !== feature.slug
  ).slice(0, 2);

  const articleUrl = `https://campusloop.space/docs/${feature.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${feature.title}: ${feature.tagline}`,
    description: feature.description,
    url: articleUrl,
    author: { "@type": "Person", name: "Shaswat Raj", url: "https://campusloop.space" },
    publisher: { "@type": "Organization", name: "CampusLoop", url: "https://campusloop.space" },
    mainEntityOfPage: articleUrl,
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: feature.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingShell>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 sm:px-6 py-12 sm:py-16 space-y-10">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1 hover:text-brand-text transition-colors"
            >
              <ArrowLeft className="size-3" /> All Essays
            </Link>
            <span aria-hidden>/</span>
            <span>{feature.category}</span>
            <span aria-hidden>/</span>
            <span className="text-foreground font-semibold">{feature.title}</span>
          </nav>

          {/* Article Header (Twitter/Substack Longform Styling) */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-brand-subtle px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-brand-text">
                <DocsFeatureIcon slug={feature.slug} className="size-3" />
                {feature.category}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{feature.readTime}</span>
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="font-mono text-xs text-muted-foreground">By Shaswat Raj, CampusLoop</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-foreground">
              {feature.title}
            </h1>
            <p className="text-lg sm:text-xl leading-relaxed text-muted-foreground font-medium">
              {feature.tagline}
            </p>
          </header>

          {/* Social Share & Copy Bar */}
          <DocsShareToolbar title={feature.title} viralQuote={feature.viralQuote} url={articleUrl} />

          {/* Viral Hook Blockquote */}
          <div className="relative rounded-2xl border border-border/60 bg-muted/25 p-6 sm:p-7 space-y-3">
            <Quote className="size-6 text-brand-text" />
            <div className="space-y-2 text-base sm:text-lg leading-relaxed text-foreground font-medium whitespace-pre-line">
              {feature.hook}
            </div>
          </div>

          {/* Key Engineering Takeaways Box */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand-text" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                Key Architectural Takeaways
              </span>
            </div>
            <ul className="space-y-2">
              {feature.takeaways.map((takeaway) => (
                <li
                  key={takeaway}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed"
                >
                  <span className="font-mono text-xs font-bold text-brand-text shrink-0 mt-0.5">→</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Essay Body */}
          <article className="space-y-10 pt-2 text-foreground">
            {/* Section 1: The Problem */}
            <section className="space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-destructive">
                {"01 // THE GROUND REALITY"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                The Anatomy of the Problem
              </h2>
              <div className="text-sm sm:text-base leading-relaxed text-muted-foreground space-y-3 whitespace-pre-line">
                {feature.problem}
              </div>
            </section>

            {/* Section 2: What Changes Here */}
            <section className="space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand-text">
                {"02 // THE ARCHITECTURAL SHIFT"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                How the Math and Design Changes
              </h2>
              <div className="text-sm sm:text-base leading-relaxed text-muted-foreground space-y-3 whitespace-pre-line">
                {feature.shift}
              </div>
            </section>

            {/* Section 3: Step-by-Step Mechanics */}
            <section className="space-y-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-success">
                {"03 // ENGINEERING MECHANICS"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <ListChecks className="size-5 text-brand-text" />
                <span>Step-by-Step System Execution</span>
              </h2>
              <ol className="space-y-3">
                {feature.howItWorks.map((step, i) => (
                  <li key={step} className="flex gap-3.5 rounded-xl border border-border/60 bg-card p-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-subtle font-mono text-xs font-bold text-brand-text">
                      {i + 1}
                    </span>
                    <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Section 4: System Invariants */}
            <section className="space-y-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand-text">
                {"04 // GUARANTEED INVARIANTS"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Why It Holds Up Under Pressure
              </h2>
              <ul className="space-y-2.5">
                {feature.proofPoints.map((p) => (
                  <li
                    key={p}
                    className="flex gap-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Viral One-Liner Quote Banner */}
            <div className="rounded-2xl border border-border bg-brand-subtle p-6 text-center space-y-2">
              <span className="font-mono text-[10px] font-bold text-brand-text uppercase tracking-widest">
                VIRAL TAKEAWAY
              </span>
              <p className="text-base sm:text-lg font-bold text-foreground italic">
                &ldquo;{feature.viralQuote}&rdquo;
              </p>
            </div>

            {/* Section 5: FAQs */}
            <section className="space-y-4 pt-4 border-t border-border/40">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {"05 // QUESTIONS &amp; ANSWERS"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Direct Answers. No PR Spin.
              </h2>
              <div className="space-y-3">
                {feature.faq.map((f) => (
                  <details key={f.q} className="group rounded-xl border border-border/60 bg-card">
                    <summary className="cursor-pointer px-5 py-4 text-xs sm:text-sm font-bold text-foreground group-open:text-brand-text transition-colors">
                      {f.q}
                    </summary>
                    <p className="border-t border-border/40 px-5 pt-3 pb-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </article>

          {/* Related Reading in Category */}
          {related.length > 0 && (
            <section className="pt-8 border-t border-border/40 space-y-3">
              <h3 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
                More Essays in {feature.category}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/docs/${r.slug}`}
                    className="group rounded-xl border border-border/60 bg-card p-4 hover:border-border-strong transition-colors"
                  >
                    <p className="text-sm font-bold text-foreground group-hover:text-brand-text transition-colors">
                      {r.title}
                    </p>
                    <p className="mt-1 line-clamp-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                      {r.tagline}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Previous & Next Navigation */}
          <nav className="grid gap-3 pt-6 sm:grid-cols-2">
            <Link
              href={`/docs/${prev.slug}`}
              className="group rounded-xl border border-border/60 bg-card p-4 hover:border-border-strong transition-colors"
            >
              <span className="font-mono text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Previous Essay
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground group-hover:text-brand-text transition-colors">
                <ArrowLeft className="size-3.5" /> {prev.title}
              </span>
            </Link>
            <Link
              href={`/docs/${next.slug}`}
              className="group rounded-xl border border-border/60 bg-card p-4 text-right hover:border-border-strong transition-colors"
            >
              <span className="font-mono text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Next Essay
              </span>
              <span className="mt-1 flex items-center justify-end gap-1.5 text-xs sm:text-sm font-bold text-foreground group-hover:text-brand-text transition-colors">
                {next.title} <ArrowRight className="size-3.5" />
              </span>
            </Link>
          </nav>
        </main>

        <CTABand
          title="See this architecture running on your campus."
          lede="The essays explain the engineering. Your college email unlocks the live timeline."
          primaryHref={user ? "/feeds" : "/sign-up"}
          primaryLabel={user ? "Open your feed" : "Join with college email"}
          secondaryHref="/docs"
          secondaryLabel="All architecture essays"
        />
      </MarketingShell>
    </>
  );
}
