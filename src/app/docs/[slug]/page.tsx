import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsArticleBody } from "@/components/docs/docs-article-body";
import { DocsJoinBand } from "@/components/docs/docs-join-band";
import { DocsShareToolbar } from "@/components/docs/docs-share-toolbar";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { hexclaveServerApp } from "@/hexclave/server";
import { DOCS_FEATURES, getDocsFeature, getDocsSlugs } from "@/lib/docs-features";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, ogImageUrl, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

const DOCS_AUTHOR = "Shaswat Raj";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDocsSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const feature = getDocsFeature(slug);
  if (!feature) notFound();
  return buildMetadata({
    title: `How ${feature.title} works`,
    description: feature.description,
    path: `/docs/${feature.slug}`,
    image: ogImageUrl(feature.title, "How it works"),
    type: "article",
    authors: [DOCS_AUTHOR],
    keywords: feature.keywords,
  });
}

export default async function DocsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = getDocsFeature(slug);
  if (!feature) notFound();
  const user = await hexclaveServerApp.getUser();

  const idx = DOCS_FEATURES.findIndex((f) => f.slug === feature.slug);
  const prev = DOCS_FEATURES[(idx - 1 + DOCS_FEATURES.length) % DOCS_FEATURES.length];
  const next = DOCS_FEATURES[(idx + 1) % DOCS_FEATURES.length];
  const path = `/docs/${feature.slug}`;

  const faqJsonLd = {
    "@type": "FAQPage",
    mainEntity: feature.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Docs", path: "/docs" },
            { name: feature.title, path },
          ]),
          {
            "@type": "TechArticle",
            headline: `${feature.title}: ${feature.tagline}`.slice(0, 110),
            description: feature.description,
            url: absoluteUrl(path),
            mainEntityOfPage: absoluteUrl(path),
            author: { "@type": "Person", name: DOCS_AUTHOR },
            publisher: { "@id": `${SITE_URL}/#organization` },
            inLanguage: "en-IN",
          },
          faqJsonLd,
        ]}
      />
      <MarketingShell isAuthenticated={Boolean(user)}>
        <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-6 sm:py-14">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-fg-muted">
            <Link href="/docs" className="inline-flex min-h-11 items-center gap-1 hover:text-fg">
              <ArrowLeft aria-hidden className="size-4" />
              All docs
            </Link>
            <span aria-hidden>/</span>
            <span>{feature.category}</span>
          </nav>

          <header className="space-y-4">
            <h1 className="text-4xl leading-[1.05] text-fg text-balance sm:text-5xl">{feature.title}</h1>
            <p className="text-lg text-fg-muted text-pretty sm:text-xl">{feature.tagline}</p>
            <p className="flex items-center gap-2 text-sm text-fg-muted">
              <Clock aria-hidden className="size-4" />
              {feature.readTime}
              <span aria-hidden>·</span>
              By {DOCS_AUTHOR}
            </p>
          </header>

          <DocsShareToolbar title={feature.title} viralQuote={feature.viralQuote} url={absoluteUrl(path)} />

          <DocsArticleBody feature={feature} />

          <nav aria-label="More docs" className="grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
            <Link
              href={`/docs/${prev.slug}`}
              className="group rounded-lg border border-border p-4 transition-ui hover:border-border-strong"
            >
              <span className="text-xs text-fg-muted">Previous</span>
              <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-fg group-hover:text-brand-text">
                <ArrowLeft aria-hidden className="size-4" />
                {prev.title}
              </span>
            </Link>
            <Link
              href={`/docs/${next.slug}`}
              className="group rounded-lg border border-border p-4 text-right transition-ui hover:border-border-strong"
            >
              <span className="text-xs text-fg-muted">Next</span>
              <span className="mt-1 flex items-center justify-end gap-1.5 text-sm font-semibold text-fg group-hover:text-brand-text">
                {next.title}
                <ArrowRight aria-hidden className="size-4" />
              </span>
            </Link>
          </nav>
        </div>

        <DocsJoinBand signedIn={Boolean(user)} />
      </MarketingShell>
    </>
  );
}
