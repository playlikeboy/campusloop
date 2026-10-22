import type { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";
import { CatalogBrowse } from "@/components/courses/catalog/catalog-browse";
import { CatalogResults } from "@/components/courses/catalog/catalog-results";
import { ItemListJsonLd } from "@/components/courses/catalog/item-list-json-ld";
import { catalogHref, isBrowseHome, parseCatalogParams } from "@/lib/courses/catalog-params";
import { getBrowseRows, listCategoryCounts, listCourses } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const SITE = "https://campusloop.space";
const DESCRIPTION =
  "Watch full free courses including all of Harvard's CS50 lectures, track your progress lecture by lecture, take notes, ask questions and earn a certificate. Students can create and share their own courses too.";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = parseCatalogParams(await searchParams);
  const canonical = `${SITE}${catalogHref(p, { page: p.page })}`;
  const title = p.q ? `${p.q} courses` : "Free Online Courses: CS50, Python, Web, AI and More";
  return {
    title: p.page > 1 ? `${title} (page ${p.page})` : title,
    description: p.q ? `Free ${p.q} courses with progress tracking, notes, Q&A and certificates on CampusLoop.` : DESCRIPTION,
    alternates: { canonical },
    // Free-text search pages are thin duplicates of category pages; keep them out of the index.
    robots: p.q ? { index: false, follow: true } : undefined,
    openGraph: { title: "Courses on CampusLoop", description: "Free courses with progress tracking, notes, Q&A and certificates, including every Harvard CS50 lecture.", url: canonical, siteName: "CampusLoop", type: "website" },
  };
}

export default async function CoursesPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params = parseCatalogParams(raw);
  // Old ?category= links move to the topic's own URL.
  if (params.category) permanentRedirect(catalogHref(params, { page: params.page }));

  if (isBrowseHome(params)) {
    const [{ rows, categories }, all] = await Promise.all([getBrowseRows(), listCourses({ ...params })]);
    return (
      <>
        <ItemListJsonLd courses={all.courses} />
        <CatalogBrowse params={params} rows={rows} categories={categories} all={all} />
      </>
    );
  }

  const [result, categories] = await Promise.all([listCourses(params), listCategoryCounts()]);
  if (params.page > result.pages) redirect(catalogHref(params, { page: result.pages }));
  return (
    <>
      <ItemListJsonLd courses={result.courses} />
      <CatalogResults params={params} result={result} categories={categories} />
    </>
  );
}
