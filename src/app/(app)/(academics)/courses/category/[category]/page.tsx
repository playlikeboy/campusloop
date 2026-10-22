import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  const p = parseCatalogParams(await searchParams, category);
  const canonical = `https://campusloop.space${catalogHref(p, { page: p.page })}`;
  const title = `Free ${category} Courses${p.page > 1 ? ` (page ${p.page})` : ""}`;
  const description = `Learn ${category.toLowerCase()} with free video courses: track progress lecture by lecture, take notes, ask questions and earn a certificate.`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: p.q ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: canonical, siteName: "CampusLoop", type: "website" },
  };
}

export default async function CourseCategoryPage({ params, searchParams }: Props) {
  const category = categoryFromSlug((await params).category);
  if (!category) notFound();
  const p = parseCatalogParams(await searchParams, category);
  const [result, categories] = await Promise.all([listCourses(p), listCategoryCounts()]);
  return (
    <>
      <ItemListJsonLd courses={result.courses} />
      <CatalogResults params={p} result={result} categories={categories} />
    </>
  );
}
