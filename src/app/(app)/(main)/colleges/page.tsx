import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  COLLEGE_DIRECTORY_STATES,
  type CollegeDirectoryPage,
  collegesHref,
  getCollegeDirectoryPage,
} from "@/lib/colleges/directory";
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
  "Browse 1,350+ colleges in our directory. Each college has a campus hub with a student feed, communities, events, and study material.";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { page, state } = parseDirectoryParams(await searchParams);
  // Paginated and state-filtered listings are distinct documents, so each one is its own canonical.
  const canonical = `https://campusloop.space${collegesHref({ page, state })}`;
  const title = state !== "ALL" ? `Colleges in ${state}` : page > 1 ? `Colleges · Page ${page}` : "Colleges";

  return {
    title,
    description: DESCRIPTION,
    keywords: [
      "Indian College Directory",
      "College Hubs India",
      "Engineering Colleges",
      "Medical Colleges",
      "Campus Directory",
      "Verified Student Communities",
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description: DESCRIPTION,
      url: canonical,
      siteName: "CampusLoop",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: "https://campusloop.space/og-colleges.png",
          width: 1536,
          height: 1024,
          alt: "CampusLoop College Directory",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: DESCRIPTION,
      images: ["https://campusloop.space/og-colleges.png"],
    },
    robots: { index: true, follow: true },
  };
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

  const canonical = `https://campusloop.space${collegesHref({ page, state })}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: state !== "ALL" ? `Colleges in ${state}` : "Indian College Directory",
    url: canonical,
    description: DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: "CampusLoop",
      url: "https://campusloop.space",
      logo: "https://campusloop.space/logo.png",
    },
    ...(initial
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: initial.colleges.length,
            itemListElement: initial.colleges.map((college, index) => ({
              "@type": "ListItem",
              position: (initial.page - 1) * 50 + index + 1,
              name: college.name,
              url: `https://campusloop.space/college/${college.slug || college.id}`,
            })),
          },
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <CollegesClient
          initialColleges={initial?.colleges}
          initialTotal={initial?.total}
          initialTotalPages={initial?.totalPages}
        />
      </Suspense>
      {/* Crawlable state filters: the dropdown above is a <select>, which search engines cannot follow. */}
      <nav
        aria-label="Browse colleges by state"
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-28 -mt-20 text-xs text-muted-foreground"
      >
        <h2 className="font-bold text-foreground mb-2">Browse colleges by state</h2>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          <li>
            <Link href="/colleges" className="hover:text-foreground hover:underline">
              All states
            </Link>
          </li>
          {COLLEGE_DIRECTORY_STATES.map((s) => (
            <li key={s}>
              <Link href={collegesHref({ state: s })} className="hover:text-foreground hover:underline">
                {s}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
