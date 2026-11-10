import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ExploreClient } from "@/components/explore/explore-client";
import type { SearchCategoryFilter, SearchScope } from "@/lib/search/types";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import ExploreLoading from "./loading";

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string;
    scope?: string;
    type?: string;
    sort?: string;
    topic?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ExplorePageProps): Promise<Metadata> {
  const q = (await searchParams).q?.trim();
  if (q) {
    return buildMetadata({
      title: `"${q.slice(0, 40)}" on CampusLoop`,
      description: `People, communities, posts and study material that match "${q.slice(0, 60)}".`,
      path: "/explore",
      noindex: true,
    });
  }
  return buildMetadata({
    title: "Explore",
    description:
      "Search for students, communities, events, posts and study material from colleges across India.",
    path: "/explore",
  });
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";

  if (q.startsWith("#")) {
    const cleanTag = q.replace(/^#+/, "").trim();
    if (cleanTag) {
      redirect(`/hashtag/${encodeURIComponent(cleanTag.toLowerCase())}`);
    }
  }

  const rawScope = params.scope?.toUpperCase();
  const scope: SearchScope = rawScope === "GLOBAL" || rawScope === "INDIA" ? "INDIA" : "CAMPUS";
  const type = (params.type?.toUpperCase() || "ALL") as SearchCategoryFilter;

  return (
    <>
      {q ? null : <JsonLd data={breadcrumbJsonLd([{ name: "Explore", path: "/explore" }])} />}
      <Suspense fallback={<ExploreLoading />}>
        <ExploreClient initialQuery={q} initialScope={scope} initialType={type} />
      </Suspense>
    </>
  );
}
