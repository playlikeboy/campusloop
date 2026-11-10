import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CatalogResults } from "@/components/courses/catalog/catalog-results";
import { ItemListJsonLd } from "@/components/courses/catalog/item-list-json-ld";
import { catalogHref, categoryFromSlug, parseCatalogParams } from "@/lib/courses/catalog-params";
import { listCategoryCounts, listCourses } from "@/lib/courses/server";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = categoryFromSlug((await params).category);
  if (!category) notFound();
  const catalogParams = parseCatalogParams(await searchParams, category);
  const title = `Free ${category} courses${catalogParams.page > 1 ? ` (page ${catalogParams.page})` : ""}`;
  const description = `Free ${category.toLowerCase()} video courses. Track each lecture, take notes and ask questions.`;
  const hasFilters = Boolean(
    catalogParams.q ||
      catalogParams.level ||
      catalogParams.duration ||
      catalogParams.source ||
      catalogParams.lang ||
      catalogParams.page > 1 ||
      catalogParams.sort !== "popular"
  );
  const canonicalPath = catalogHref(catalogParams, { page: catalogParams.page });
  const meta = buildMetadata({ title, description, path: canonicalPath, noindex: hasFilters });
  return {
    ...meta,
    alternates: { canonical: absoluteUrl(canonicalPath) },
    // Filtered views are not indexed, but their links are still followed.
    robots: hasFilters ? { index: false, follow: true } : meta.robots,
  };
}

export default async function CourseCategoryPage({ params, searchParams }: Props) {
  const category = categoryFromSlug((await params).category);
  if (!category) notFound();
  const catalogParams = parseCatalogParams(await searchParams, category);
  const [result, categories] = await Promise.all([listCourses(catalogParams), listCategoryCounts()]);
  if (result.pages > 0 && catalogParams.page > result.pages)
    redirect(catalogHref(catalogParams, { page: result.pages }));
  return (
    <>
      <ItemListJsonLd courses={result.courses} />
      <CatalogResults params={catalogParams} result={result} categories={categories} />
    </>
  );
}
