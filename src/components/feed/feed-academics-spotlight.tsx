"use client";

import {
  ArrowRight,
  BookOpen,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AcademicItem {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  branch: string;
  semester: number;
  resourceType: string;
  upvotesCount: number;
  downloadsCount: number;
  viewsCount: number;
}

function getResourceTypePill(type: string) {
  const t = String(type || "").toUpperCase();
  if (t === "PYQ") return { label: "PYQ / Past Paper", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" };
  if (t === "CHEAT_SHEET") return { label: "Cheat Sheet", color: "bg-rose-500/15 text-rose-700 dark:text-rose-300" };
  if (t === "LAB_MANUAL") return { label: "Lab Manual", color: "bg-teal-500/15 text-teal-700 dark:text-teal-300" };
  return { label: "Lecture Notes", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" };
}

export function FeedAcademicsSpotlight({ className }: { className?: string }) {
  const { data } = useSWR<{ items: AcademicItem[] }>(
    "/api/academics?limit=5&sort=for_you",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <section className={cn("py-4", className)} aria-label="Campus Study Materials">
      <div className="mb-3 flex items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <GraduationCap className="size-3.5" aria-hidden />
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-sm font-bold text-foreground">Campus Notes &amp; PYQs</h3>
            <span className="hidden sm:inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              Exam Prep
            </span>
          </div>
        </div>

        <Link
          href="/academics"
          className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
        >
          Browse all notes <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4">
        {items.map((res) => {
          const pill = getResourceTypePill(res.resourceType);
          return (
            <Link
              key={res.id}
              href={`/academics/${res.id}`}
              className="group flex w-[260px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl bg-card/75 border border-border/40 shadow-2xs transition-all hover:border-primary/40 hover:shadow-md"
            >
              {/* Header */}
              <div className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold">
                  <span className={cn("rounded-full px-2 py-0.5 uppercase tracking-wide", pill.color)}>
                    {pill.label}
                  </span>
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 text-muted-foreground">
                    Sem {res.semester}
                  </span>
                </div>

                <div className="mt-2.5">
                  <p className="line-clamp-2 text-xs font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                    {res.title}
                  </p>
                  <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">
                    {res.subjectName} ({res.subjectCode})
                  </p>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-2 flex items-center justify-between border-t border-border/30 bg-muted/20 px-3.5 py-2.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <ThumbsUp className="size-3 text-muted-foreground/70" aria-hidden />
                    {res.upvotesCount || 0}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Eye className="size-3 text-muted-foreground/70" aria-hidden />
                    {res.viewsCount || 0}
                  </span>
                </div>
                <span className="font-bold text-primary group-hover:underline">Read →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
