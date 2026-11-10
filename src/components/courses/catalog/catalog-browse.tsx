import { ArrowUpRight, BookMarked, Code2, Heart, Plus, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
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

const ROW_HREF: Record<string, string> = { universities: "/courses?source=university", hindi: "/courses?lang=hindi", popular: "#all-courses", trending: "/courses?sort=trending", rating: "/courses?sort=rating", newest: "/courses?sort=newest" };

/** /courses home: search, topics, continue learning, curated rows, then the full paginated list. */
export function CatalogBrowse({ params, rows, categories, all }: Props) {
  return (
    <div className="pb-20">
      <header className="px-4 pt-2 sm:px-0 sm:pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">Learn anything, at your own pace</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">Free courses from Harvard, MIT, Stanford, IITs and India's best teachers on YouTube. Track progress and earn a certificate.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/courses/my" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-muted/70 px-4 text-sm font-semibold text-foreground hover:bg-muted">
              <BookMarked className="size-4" aria-hidden /> My learning
            </Link>
            <Link href="/courses/new" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand-hover">
              <Plus className="size-4" aria-hidden /> Create
            </Link>
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
          <CourseRow key={r.key} title={r.title} courses={r.courses} href={r.category ? `/courses/category/${categorySlug(r.category)}` : ROW_HREF[r.key]} />
        ))}
      </div>

      <section className="mx-4 mt-12 flex flex-col gap-4 rounded-2xl bg-primary/8 p-5 sm:mx-0 sm:flex-row sm:items-center sm:p-6">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Rocket className="size-6" aria-hidden /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground">Teach what you know</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            New courses start in the campus feed. Once {PROMOTION.minLearners}+ learners enrol and it is well rated, it joins this catalog.
          </p>
        </div>
        <Link href="/courses/new" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-foreground px-5 text-sm font-bold text-background hover:opacity-90">Create a course</Link>
      </section>

      {/* ─── CampusLoop Ecosystem Tools ─── */}
      <section className="mx-4 mt-12 sm:mx-0">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-bold text-foreground">Featured Student Apps</h2>
          </div>
          <Link href="/ecosystem" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            All Ecosystem Apps <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <a
          href="https://dsaloop.campusloop.space"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-brand-subtle-border"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 py-0.5 font-mono text-[11px] font-bold text-brand-text border border-brand-subtle-border">
                <Code2 className="size-3" />
                <span>Placement &amp; Coding Prep</span>
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-text" />
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground group-hover:text-brand-text transition-colors">
              DSALoop by CampusLoop
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Master coding interviews with patterns, 185+ company-tagged problems (Blind 75, Grind 169) and a 28-chapter system design primer.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-brand-text group-hover:underline">
            Explore DSALoop &rarr;
          </span>
        </a>

        <a
          href="https://baby.campusloop.space"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-brand-subtle-border"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 py-0.5 text-[11px] font-bold text-brand-text border border-brand-subtle-border">
                <Heart className="size-3" />
                <span>Mindful AI Journal</span>
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-text" />
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground group-hover:text-brand-text transition-colors">
              baby · Calm Thoughts Companion
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Exam stress or late-night reflections? Meet Kumo, a gentle AI journal that remembers. Private by default, no streaks, no noise.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-brand-text group-hover:underline">
            Meet baby &amp; Kumo &rarr;
          </span>
        </a>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="all-courses">
        <div className="flex items-end justify-between px-4 sm:px-0">
          <h2 id="all-courses" className="text-xl font-bold tracking-tight text-foreground">All courses</h2>
          <p className="text-sm text-muted-foreground">{all.total.toLocaleString("en-IN")} courses</p>
        </div>
        <ul className="mt-2 divide-y divide-border/40 px-2 sm:px-0">
          {all.courses.map((c) => (
            <li key={c.id} className="py-1"><CourseListItem course={c} /></li>
          ))}
        </ul>
        <CatalogPagination params={params} pages={all.pages} />
      </section>
    </div>
  );
}
