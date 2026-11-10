import { ArrowUpRight, BookMarked, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Course } from "@/db/schema";
import { type CatalogParams, categorySlug } from "@/lib/courses/catalog-params";
import { PROMOTION } from "@/lib/courses/promotion";
import { CategoryNav } from "./category-nav";
import { ContinueLearning } from "./continue-learning";
import { CourseListItem } from "./course-list-item";
import { CourseRow } from "./course-row";
import { CatalogPagination } from "./pagination";
import { CatalogSearchBar } from "./search-bar";

interface Props {
  params: CatalogParams;
  rows: { key: string; title: string; category?: string; courses: Course[] }[];
  categories: { category: string; count: number }[];
  all: { courses: Course[]; total: number; pages: number };
}

const ROW_HREF: Record<string, string> = {
  universities: "/courses?source=university",
  hindi: "/courses?lang=hindi",
  popular: "#all-courses",
  trending: "/courses?sort=trending",
  rating: "/courses?sort=rating",
  newest: "/courses?sort=newest",
};

/** /courses home: search, topics, continue, curated rows, then the full paginated list. */
export function CatalogBrowse({ params, rows, categories, all }: Props) {
  return (
    <div className="pb-20">
      <header className="px-4 pt-2 sm:px-0 sm:pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl text-fg sm:text-4xl">Free courses</h1>
            <p className="mt-1 max-w-xl text-fg-muted">
              Video courses from universities and YouTube teachers. Track your progress and get a certificate
              when you finish.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href="/courses/my">
                <BookMarked aria-hidden /> My learning
              </Link>
            </Button>
            <Button asChild>
              <Link href="/courses/new">
                <Plus aria-hidden /> Create
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <CatalogSearchBar />
          <CategoryNav categories={categories} active={null} />
        </div>
      </header>

      <div className="mt-8">
        <ContinueLearning />
        {rows.map((r) => (
          <CourseRow
            key={r.key}
            title={r.title}
            courses={r.courses}
            href={r.category ? `/courses/category/${categorySlug(r.category)}` : ROW_HREF[r.key]}
          />
        ))}
      </div>

      <section
        aria-labelledby="teach"
        className="mx-4 mt-12 flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:mx-0 sm:flex-row sm:items-center sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <h2 id="teach" className="text-lg text-fg">
            Teach what you know
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            Your course shows up for students at your college first. Once {PROMOTION.minLearners} people join
            and rate it well, it joins this catalog.
          </p>
        </div>
        <Button asChild variant="secondary" className="shrink-0">
          <Link href="/courses/new">Make a course</Link>
        </Button>
      </section>

      <p className="mx-4 mt-6 text-sm text-fg-muted sm:mx-0">
        Practising for placements?{" "}
        <a
          href="https://dsaloop.campusloop.space"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-semibold text-brand-text underline-offset-2 hover:underline"
        >
          Try DSALoop <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      </p>

      <section className="mt-12" aria-labelledby="all-courses">
        <div className="flex items-end justify-between px-4 sm:px-0">
          <h2 id="all-courses" className="text-xl text-fg">
            All courses
          </h2>
          <p className="text-sm tabular-nums text-fg-muted">{all.total.toLocaleString("en-IN")} courses</p>
        </div>
        <ul className="mt-2 divide-y divide-border px-2 sm:px-0">
          {all.courses.map((c) => (
            <li key={c.id} className="py-1">
              <CourseListItem course={c} />
            </li>
          ))}
        </ul>
        <CatalogPagination params={params} pages={all.pages} />
      </section>
    </div>
  );
}
