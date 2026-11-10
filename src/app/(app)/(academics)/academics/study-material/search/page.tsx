import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSpinner } from "@/components/shells/page-loading";
import { buildMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { AcademicsSearchClient } from "./search-client";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    branch?: string;
    semester?: string;
    sort?: string;
    scope?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const meta = buildMetadata({
    title: q ? `"${q}" in study material` : "Search study material",
    description:
      "Search notes, past papers (PYQs), formula sheets and lab manuals by subject, branch and semester.",
    path: "/academics/study-material/search",
    noindex: true,
  });
  // Search results are not indexed, but their links are followed.
  return { ...meta, robots: { index: false, follow: true } };
}

export default async function AcademicsSearchPage({ searchParams }: SearchPageProps) {
  const [resolvedParams, user] = await Promise.all([searchParams, getCachedAuthUser()]);
  const profile = user ? await getCachedUserProfile(user.id) : null;

  return (
    <Suspense fallback={<PageSpinner />}>
      <AcademicsSearchClient
        profileId={profile?.id ?? null}
        initialQuery={resolvedParams?.q || ""}
        initialType={resolvedParams?.type || "all"}
        initialBranch={resolvedParams?.branch || "All"}
        initialSemester={resolvedParams?.semester || "all"}
        initialSort={resolvedParams?.sort || (resolvedParams?.q ? "relevance" : "latest")}
        initialScope={(resolvedParams?.scope as "campus" | "global") || "global"}
      />
    </Suspense>
  );
}
