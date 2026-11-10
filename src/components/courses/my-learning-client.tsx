"use client";

import { Award, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMyLearning } from "@/hooks/use-courses";
import { cn } from "@/lib/utils";
import { CourseCard } from "./course-card";

type Tab = "learning" | "wishlist" | "certificates";

export function MyLearningClient() {
  const { data, error, isLoading } = useMyLearning();
  const [tab, setTab] = useState<Tab>("learning");
  const learning = data?.learning ?? [];
  const inProgress = learning.filter((l) => !l.completedAt);
  const done = learning.filter((l) => l.completedAt);

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "learning", label: "My courses", n: learning.length },
    { id: "wishlist", label: "Wishlist", n: data?.wishlist.length ?? 0 },
    { id: "certificates", label: "Certificates", n: data?.certificates.length ?? 0 },
  ];

  const grid = (items: typeof learning) => (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((l) => (
        <li key={l.course.id}>
          <CourseCard
            course={l.course}
            href={`/learn/${l.course.slug}`}
            progress={l.course.lecturesCount ? Math.min(100, Math.round((l.completedLectures / l.course.lecturesCount) * 100)) : 0}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="px-4 pb-16 sm:px-0">
      <h1 className="text-3xl font-black tracking-tight text-foreground">My learning</h1>
      <div className="mt-5 flex gap-1 overflow-x-auto no-scrollbar" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("h-9 shrink-0 rounded-full px-4 text-sm font-semibold cursor-pointer", tab === t.id ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground")}
          >
            {t.label} <span className="ml-1 opacity-70">{t.n}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error ? (
          <p className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">Could not load your courses.</p>
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted/60" />)}</div>
        ) : tab === "learning" ? (
          learning.length === 0 ? (
            <Empty icon={BookOpen} title="You haven't started a course yet" body="Pick something from the catalog. Every course is free." />
          ) : (
            <div className="space-y-10">
              {inProgress.length > 0 && <section><h2 className="mb-3 text-lg font-bold">In progress</h2>{grid(inProgress)}</section>}
              {done.length > 0 && <section><h2 className="mb-3 text-lg font-bold">Completed</h2>{grid(done)}</section>}
            </div>
          )
        ) : tab === "wishlist" ? (
          (data?.wishlist.length ?? 0) === 0 ? (
            <Empty icon={BookOpen} title="Your wishlist is empty" body="Save courses from their page to find them here." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data?.wishlist.map((c) => <li key={c.id}><CourseCard course={c} /></li>)}</ul>
          )
        ) : (data?.certificates.length ?? 0) === 0 ? (
          <Empty icon={Award} title="No certificates yet" body="Finish every lecture of a course to earn one." />
        ) : (
          <ul className="space-y-2">
            {data?.certificates.map((c) => (
              <li key={c.id}>
                <Link href={`/certificates/${c.id}`} className="flex min-h-16 items-center gap-4 rounded-2xl bg-card/60 px-4 shadow-2xs hover:bg-muted/50">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Award className="size-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">{c.courseTitle}</span>
                    <span className="text-xs text-muted-foreground">Issued {new Date(c.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Empty({ icon: Icon, title, body }: { icon: typeof Award; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-card/60 p-10 text-center shadow-2xs">
      <Icon className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Link href="/courses" className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Browse courses</Link>
    </div>
  );
}
