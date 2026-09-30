import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ExploreClient } from "@/components/explore/explore-client";
import type { SearchCategoryFilter, SearchScope } from "@/lib/search/types";
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
  const params = await searchParams;
  const q = params.q?.trim();

  if (q) {
    const title = `Search results for "${q}"`;
    const description = `Explore verified student profiles, clubs, notes, and discussions matching "${q}" on CampusLoop.`;

    return {
      title,
      description,
      alternates: {
        canonical: `https://campusloop.space/explore?q=${encodeURIComponent(q)}`,
      },
      robots: {
        index: false,
        follow: true,
      },
      openGraph: {
        title: `${title} | CampusLoop`,
        description,
        url: `https://campusloop.space/explore?q=${encodeURIComponent(q)}`,
        siteName: "CampusLoop",
        locale: "en_IN",
        images: [{ url: "https://campusloop.space/og-image.png", width: 1200, height: 630 }],
      },
    };
  }

  const title = "Explore Campuses, Clubs & Student Vibes Across India";
  const description =
    "CampusLoop discovery hub — find student clubs, upcoming hackathons, semester study notes, placement roadmaps, and trending campus pulse across India.";

  return {
    title,
    description,
    keywords: [
      "CampusLoop Explore",
      "Discover Indian Campuses",
      "College Clubs and Events",
      "Engineering Notes and PYQs",
      "Campus Discussions",
    ],
    alternates: { canonical: "https://campusloop.space/explore" },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: "https://campusloop.space/explore",
      siteName: "CampusLoop",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: "https://campusloop.space/og-image.png",
          width: 1200,
          height: 630,
          alt: "CampusLoop Explore",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://campusloop.space/og-image.png"],
    },
  };
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

  const jsonLd = q
    ? {
        "@context": "https://schema.org",
        "@type": "SearchResultsPage",
        name: `Search results for "${q}"`,
        url: `https://campusloop.space/explore?q=${encodeURIComponent(q)}`,
        description: `Explore student profiles, clubs, notes, and discussions matching "${q}" on CampusLoop.`,
      }
    : {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "CampusLoop Explore",
        url: "https://campusloop.space/explore",
        description: "CampusLoop discovery hub — student clubs, upcoming hackathons, and notes across India.",
        publisher: {
          "@type": "Organization",
          name: "CampusLoop Inc.",
          url: "https://campusloop.space",
          logo: "https://campusloop.space/logo.png",
        },
      };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={<ExploreLoading />}>
        <ExploreClient
          initialQuery={q}
          initialScope={scope}
          initialType={type}
        />
      </Suspense>
    </>
  );
}
