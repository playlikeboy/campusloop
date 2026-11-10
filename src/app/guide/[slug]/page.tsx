import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticle } from "@/components/guide/guide-article";
import { CTABand } from "@/components/marketing/system";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { GUIDES, getGuide, getGuideSlugs } from "@/lib/guide";
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const description = g.summary.length >= 70 ? g.summary : `${g.summary} ${g.purpose}`;
  return buildMetadata({
    title: `${g.title} guide`,
    description: description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description,
    path: `/guide/${g.slug}`,
    type: "article",
    modifiedTime: g.updated,
    keywords: g.keywords,
  });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const idx = GUIDES.findIndex((x) => x.slug === g.slug);
  const related = g.related.map((r) => getGuide(r)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const url = `${SITE_URL}/guide/${g.slug}`;

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "HowTo",
            name: `How to use ${g.title} on CampusLoop`,
            description: g.summary,
            url,
            dateModified: g.updated,
            step: g.howToUse.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
          },
          {
            "@type": "FAQPage",
            mainEntity: g.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
          breadcrumbJsonLd([
            { name: "Guide", path: "/guide" },
            { name: g.title, path: `/guide/${g.slug}` },
          ]),
        ]}
      />
      <div className="mx-auto w-full max-w-3xl px-[var(--gutter)] py-10 sm:py-14">
        <GuideArticle guide={g} prev={GUIDES[idx - 1]} next={GUIDES[idx + 1]} related={related} />
      </div>
      <CTABand
        title={`Try ${g.title} on your campus.`}
        lede="Free for students."
        primaryHref="/sign-up"
        primaryLabel="Join with college email"
        secondaryHref="/guide"
        secondaryLabel="All guides"
      />
    </MarketingShell>
  );
}
