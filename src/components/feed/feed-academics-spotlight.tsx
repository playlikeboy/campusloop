"use client";

import { Eye, ThumbsUp } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { FeedSpotlightHeader } from "@/components/feed/feed-spotlight-header";
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
  const color = "bg-surface-muted text-fg-muted";
  if (t === "PYQ") return { label: "Past paper", color };
  if (t === "CHEAT_SHEET") return { label: "Cheat sheet", color };
  if (t === "LAB_MANUAL") return { label: "Lab manual", color };
  return { label: "Notes", color };
}

export function FeedAcademicsSpotlight({ className }: { className?: string }) {
  const { data } = useSWR<{ items: AcademicItem[] }>("/api/academics?limit=5&sort=for_you", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <section className={cn("py-4", className)} aria-labelledby="feed-study-title">
      <FeedSpotlightHeader id="feed-study-title" title="Notes and past papers" href="/academics" />

      <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4">
        {items.map((res) => {
          const pill = getResourceTypePill(res.resourceType);
          return (
            <Link
              key={res.id}
              href={`/academics/${res.id}`}
              className="group flex w-[260px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-lg bg-surface border border-border transition-ui hover:border-border-strong"
            >
              {/* Header */}
              <div className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1.5 text-xs font-medium">
                  <span className={cn("rounded-full px-2 py-0.5", pill.color)}>{pill.label}</span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-fg-muted">
                    Sem {res.semester}
                  </span>
                </div>

                <div className="mt-2.5">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-fg group-hover:text-brand-text transition-ui">
                    {res.title}
                  </p>
                  <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                    {res.subjectName} ({res.subjectCode})
                  </p>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-2 flex items-center justify-between border-t border-border px-3.5 py-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <ThumbsUp className="size-3.5" aria-hidden />
                    <span className="sr-only">Upvotes:</span>
                    {res.upvotesCount || 0}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Eye className="size-3.5" aria-hidden />
                    <span className="sr-only">Views:</span>
                    {res.viewsCount || 0}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
