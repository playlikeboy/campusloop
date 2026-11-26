import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleLinkList, PageLinks } from "@/components/articles/article-link-list";
import { ARTICLE_CATEGORY_LIST, type ArticleCategoryMeta } from "@/constants/articles";
import { CATEGORY_INTROS } from "@/lib/articles/category-intros";
import { categoryArticlesWhere, categoryCounts, indexableArticleWhere, listArticles } from "@/lib/articles/hub-queries";
import { ARTICLE_CATEGORY_PAGE_SIZE, categoryPagePath, clampDescription } from "@/lib/articles/seo";
import { breadcrumbJsonLd, buildMetadata, collectionPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

/** Two categories share the label "Internships & Fellowships"; hub titles must differ. */
const HUB_TITLE_OVERRIDES: Partial<Record<string, string>> = {
  FELLOWSHIPS: "Research fellowships and stipends",
  JOBS_AND_CAREER: "Jobs and careers for freshers",
};

export function categoryFromSlug(slug: string): ArticleCategoryMeta | null {
  return ARTICLE_CATEGORY_LIST.find((c) => c.slug === slug.toLowerCase()) ?? null;
}

export function categoryHubTitle(meta: ArticleCategoryMeta, page = 1): string {
  const base = HUB_TITLE_OVERRIDES[meta.key] ?? `${meta.label} articles`;
  return page > 1 ? `${base} (page ${page})` : base;
}

export function categoryHubMetadata(slug: string, page: number): Metadata {
  const meta = categoryFromSlug(slug);
  if (!meta) notFound();
  return buildMetadata({
    title: categoryHubTitle(meta, page),
    description: clampDescription(CATEGORY_INTROS[meta.key]),
    path: categoryPagePath(meta.slug, page),
    keywords: [meta.label, "student articles", "college students India"],
  });
}

export async function CategoryHub({ slug, page }: { slug: string; page: number }) {
  const meta = categoryFromSlug(slug);
  if (!meta) notFound();

  const [{ rows, total, totalPages }, counts] = await Promise.all([
    listArticles(categoryArticlesWhere(meta.key), page, ARTICLE_CATEGORY_PAGE_SIZE),
    categoryCounts(indexableArticleWhere()).catch(() => []),
  ]);
  if (total === 0 || page > totalPages) notFound();

  const path = categoryPagePath(meta.slug, page);
  const title = categoryHubTitle(meta);
  const intro = CATEGORY_INTROS[meta.key];
  const nonEmpty = new Set(counts.map((c) => c.category));
  const others = ARTICLE_CATEGORY_LIST.filter((c) => c.key !== meta.key && nonEmpty.has(c.key))
    .sort((a, b) => Number(b.group === meta.group) - Number(a.group === meta.group))
    .slice(0, 10);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Articles", path: "/articles" },
            { name: meta.label, path: categoryPagePath(meta.slug) },
            ...(page > 1 ? [{ name: `Page ${page}`, path }] : []),
          ]),
          collectionPageJsonLd({
            name: categoryHubTitle(meta, page),
            path,
            description: intro,
            startPosition: (page - 1) * ARTICLE_CATEGORY_PAGE_SIZE + 1,
            items: rows.map((r) => ({ name: r.title, path: `/articles/${r.slug}` })),
          }),
        ]}
      />
      <div className="mx-auto max-w-3xl space-y-8 pb-32 pt-4 sm:pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
          <Link href="/articles" className="hover:underline">
            Articles
          </Link>
          <span aria-hidden> / </span>
          <span>{meta.label}</span>
        </nav>
        <header className="space-y-3">
          <h1 className="text-[2rem] leading-[1.1] text-fg text-balance sm:text-4xl">{title}</h1>
          {page === 1 ? (
            <p className="max-w-[68ch] text-base text-fg-muted">{intro}</p>
          ) : (
            <p className="text-base text-fg-muted">
              Page {page} of {meta.label}. <Link href={categoryPagePath(meta.slug)} className="underline">Start from page 1</Link>.
            </p>
          )}
          <p className="text-sm text-fg-muted tabular-nums">
            {total} {total === 1 ? "article" : "articles"}
          </p>
        </header>

        <section aria-label={`${meta.label} articles`}>
          <ArticleLinkList items={rows} showCategory={false} />
          <PageLinks page={page} totalPages={totalPages} hrefFor={(n) => categoryPagePath(meta.slug, n)} />
        </section>

        {others.length > 0 && (
          <section aria-labelledby="more-topics" className="space-y-3 border-t border-border pt-8">
            <h2 id="more-topics" className="text-xl text-fg">
              More topics
            </h2>
            <ul className="flex flex-wrap gap-2">
              {others.map((c) => (
                <li key={c.key}>
                  <Link
                    href={categoryPagePath(c.slug)}
                    className="inline-flex h-11 items-center rounded-full bg-surface-muted px-4 text-sm font-medium text-fg-muted transition-ui hover:bg-surface-sunken hover:text-fg"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
