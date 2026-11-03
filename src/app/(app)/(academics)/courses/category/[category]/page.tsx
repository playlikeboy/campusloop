import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CatalogResults } from "@/components/courses/catalog/catalog-results";
import { ItemListJsonLd } from "@/components/courses/catalog/item-list-json-ld";
import { catalogHref, categoryFromSlug, parseCatalogParams } from "@/lib/courses/catalog-params";
import { listCategoryCounts, listCourses } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = categoryFromSlug((await params).category);
  if (!category) notFound();
  const catalogParams = parseCatalogParams(await searchParams, category);
  const canonical = `https://campusloop.space${catalogHref(catalogParams, { page: catalogParams.page })}`;
  const title = `Free ${category} Courses${catalogParams.page > 1 ? ` (page ${catalogParams.page})` : ""}`;
  const description = `Learn ${category.toLowerCase()} with free video courses: track progress lecture by lecture, take notes, ask questions and earn a certificate.`;
  const hasFilters = Boolean(
    catalogParams.q ||
    catalogParams.level ||
    catalogParams.duration ||
    catalogParams.source ||
    catalogParams.lang ||
    catalogParams.page > 1 ||
    catalogParams.sort !== "popular"
  );
  return {
    title,
    description,
    alternates: { canonical },
    robots: hasFilters ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: canonical, siteName: "CampusLoop", type: "website" },
  };
}

export default async function CourseCategoryPage({ params, searchParams }: Props) {
  const category = categoryFromSlug((await params).category);
  if (!category) notFound();
  const catalogParams = parseCatalogParams(await searchParams, category);
  const [result, categories] = await Promise.all([listCourses(catalogParams), listCategoryCounts()]);
  if (result.pages > 0 && catalogParams.page > result.pages) redirect(catalogHref(catalogParams, { page: result.pages }));
  return (
    <>
      <ItemListJsonLd courses={result.courses} />
      <CatalogResults params={catalogParams} result={result} categories={categories} />
    </>
  );
}
