import type { Metadata } from "next";
import { CatalogClient } from "@/components/courses/catalog-client";
import { listCourses } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Online Courses: CS50, Python, Web, AI and More",
  description:
    "Watch full free courses including all of Harvard's CS50 lectures, track your progress lecture by lecture, take notes, ask questions and earn a certificate. Students can create and share their own courses too.",
  alternates: { canonical: "https://campusloop.space/courses" },
  openGraph: {
    title: "Courses on CampusLoop",
    description: "Free courses with progress tracking, notes, Q&A and certificates, including every Harvard CS50 lecture.",
    url: "https://campusloop.space/courses",
    siteName: "CampusLoop",
    type: "website",
  },
};

export default async function CoursesPage() {
  const [initial, all] = await Promise.all([
    listCourses({ sort: "popular", limit: 24 }),
    listCourses({ limit: 60 }),
  ]);
  const categories = [...new Set(all.courses.map((c) => c.category))];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: initial.courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://campusloop.space/courses/${c.slug}`,
      name: c.title,
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CatalogClient initial={{ ...initial, hasMore: initial.total > initial.courses.length }} categories={categories} />
    </>
  );
}
