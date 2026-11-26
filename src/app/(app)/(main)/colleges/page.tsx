import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CollegesSkeleton } from "@/components/ui/skeleton-card";
import {
  COLLEGE_DIRECTORY_STATES,
  type CollegeDirectoryPage,
  collegesHref,
  getCollegeDirectoryPage,
} from "@/lib/colleges/directory";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { fitDescription } from "@/lib/seo/describe";
import { JsonLd } from "@/lib/seo/json-ld-script";
import CollegesClient from "./colleges-client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseDirectoryParams(sp: Record<string, string | string[] | undefined>) {
  const page = Math.max(1, parseInt(first(sp.page) || "1", 10) || 1);
  const state = first(sp.state) || "ALL";
  const q = (first(sp.q) || "").trim();
  const category = first(sp.category) || "ALL";
  const tab = first(sp.tab) || "directory";
  return { page, state, q, category, tab };
}

const DESCRIPTION =
  "Find your college on CampusLoop. Search Indian colleges by name or state, then see student posts, events, notes and PYQs from each campus.";

function directoryTitle(page: number, state: string) {
  if (state !== "ALL") return page > 1 ? `Colleges in ${state} · Page ${page}` : `Colleges in ${state}`;
  return page > 1 ? `Colleges · Page ${page}` : "Colleges";
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { page, state, q } = parseDirectoryParams(await searchParams);
  // A page number or state that matches no college (?page=999, ?state=Atlantis) is not indexed.
  const listing = q ? null : await getCollegeDirectoryPage({ page, state }).catch(() => null);
  const isEmpty = !q && listing !== null && listing.colleges.length === 0;
  // Paginated and state-filtered listings are their own canonical; search results are not indexed.
  return buildMetadata({
    title: directoryTitle(page, state),
    description:
      state !== "ALL"
        ? fitDescription(`Colleges in ${state} on CampusLoop. Open a college to see student posts, events, notes and PYQs`, [
            `Search by name or city, then join your campus for free`,
          ])
        : DESCRIPTION,
    path: collegesHref({ page, state }),
    keepQuery: true,
    image: { url: "/og-colleges.png", width: 1200, height: 630, alt: "Colleges on CampusLoop" },
    noindex: Boolean(q) || isEmpty,
  });
}

export default async function CollegesPage({ searchParams }: { searchParams: SearchParams }) {
  const { page, state, q, category, tab } = parseDirectoryParams(await searchParams);

  // Search, category chips and the leaderboard are interactive-only views; the
  // crawlable directory is page + state, which is what gets server-rendered.
  const prerender = !q && category === "ALL" && tab !== "leaderboard";
  let initial: CollegeDirectoryPage | null = null;
  if (prerender) {
    initial = await getCollegeDirectoryPage({ page, state }).catch((error) => {
      console.error("Failed to prerender college directory:", error);
      return null;
    });
  }

  const listPath = collegesHref({ page, state });
  const collection = {
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(listPath)}#page`,
    name: directoryTitle(page, state),
    url: absoluteUrl(listPath),
    description: DESCRIPTION,
    ...(initial
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: initial.colleges.length,
            itemListElement: initial.colleges.map((college, index) => ({
              "@type": "ListItem",
              position: (initial.page - 1) * 50 + index + 1,
              name: college.name,
              url: absoluteUrl(`/college/${college.slug || college.id}`),
            })),
          },
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={[collection, breadcrumbJsonLd([{ name: "Colleges", path: "/colleges" }])]} />
      <Suspense fallback={<CollegesSkeleton />}>
        <CollegesClient
          initialColleges={initial?.colleges}
          initialTotal={initial?.total}
          initialTotalPages={initial?.totalPages}
        />
      </Suspense>
      {/* Crawlable state filters: the dropdown above is a <select>, which search engines cannot follow. */}
      <nav
        aria-label="Browse colleges by state"
        className="mx-auto w-full max-w-3xl pb-28 text-sm text-fg-muted"
      >
        <h2 className="mb-2 text-base font-bold text-fg">Colleges by state</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          <li>
            <Link href="/colleges" className="underline-offset-4 transition-ui hover:text-fg hover:underline">
              All states
            </Link>
          </li>
          {COLLEGE_DIRECTORY_STATES.map((s) => (
            <li key={s}>
              <Link
                href={collegesHref({ state: s })}
                className="underline-offset-4 transition-ui hover:text-fg hover:underline"
              >
                {s}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
