import type { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";
import { CatalogBrowse } from "@/components/courses/catalog/catalog-browse";
import { CatalogResults } from "@/components/courses/catalog/catalog-results";
import { ItemListJsonLd } from "@/components/courses/catalog/item-list-json-ld";
import { catalogHref, isBrowseHome, parseCatalogParams } from "@/lib/courses/catalog-params";
import { currentProfile, getBrowseRows, listCategoryCounts, listCourses } from "@/lib/courses/server";
import { rememberSearch } from "@/lib/search-history";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const DESCRIPTION =
  "Watch free full courses from CS50, MIT, NPTEL and Indian YouTube teachers. Track each lecture, take notes and ask questions.";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = parseCatalogParams(await searchParams);
  const base = p.q ? `${p.q} courses` : "Free online courses";
  const title = p.page > 1 ? `${base} (page ${p.page})` : base;
  const meta = buildMetadata({
    title,
    description: p.q
      ? `Free ${p.q} courses with lecture tracking, notes and Q&A on CampusLoop.`
      : DESCRIPTION,
    path: "/courses",
    // Free-text search pages are thin duplicates of category pages; keep them out of the index.
    noindex: Boolean(p.q),
  });
  // Paginated pages keep their own canonical (buildMetadata drops query strings).
  return {
    ...meta,
    alternates: { canonical: absoluteUrl(catalogHref(p, { page: p.page })) },
    robots: p.q ? { index: false, follow: true } : meta.robots,
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

  const [result, categories, profile] = await Promise.all([
    listCourses(params),
    listCategoryCounts(),
    params.q ? currentProfile() : null,
  ]);
  // Searches personalise the feed's course slot (src/lib/courses/recommend.ts).
  if (profile && params.q) await rememberSearch(profile.id, params.q);
  if (params.page > result.pages) redirect(catalogHref(params, { page: result.pages }));
  return (
    <>
      <ItemListJsonLd courses={result.courses} />
      <CatalogResults params={params} result={result} categories={categories} />
    </>
  );
}
