"use client";

import { ArrowRight, ThumbsUp } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { sounds } from "@/lib/sounds";
import { getAvatarUrl } from "@/lib/utils";

interface SimilarResourcesWidgetProps {
  resourceId: string;
  subjectCode: string;
}

export function SimilarResourcesWidget({ resourceId, subjectCode }: SimilarResourcesWidgetProps) {
  const { data, isLoading } = useSWR<{
    similar: Array<{
      resource: {
        id: string;
        title: string;
        description?: string | null;
        subjectCode: string;
        subjectName: string;
        branch: string;
        semester: number;
        resourceType: string;
        moduleOrChapter?: string | null;
        fileUrl?: string | null;
        upvotesCount: number;
        downloadsCount: number;
        createdAt: string | Date;
        uploader: {
          id: string;
          username: string;
          displayName: string;
          avatarUrl?: string | null;
        };
        institution?: {
          name: string;
        } | null;
      };
      matchScore: number;
      matchReason: string;
    }>;
  }>(`/api/academics/${resourceId}/similar`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const similarList = data?.similar || [];

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4 border-t border-border/20">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-28 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (similarList.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 pt-6 border-t border-border/25">
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold tracking-tight text-foreground">
            Related study material
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Notes and PYQs matched to this subject and syllabus
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground border border-border/40">
          {similarList.length} results
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {similarList.map(({ resource: item, matchScore, matchReason }) => {
          const avatar = getAvatarUrl(item.uploader.avatarUrl, item.uploader.username);
          const resourceLabel = item.resourceType.replace("_", " ");
          const matchPercent = Math.round(Math.max(0, Math.min(1, matchScore)) * 100);

          return (
            <Link
              key={item.id}
              href={`/app/academics/${item.id}`}
              onClick={() => sounds.tap()}
              className="group rounded-2xl border border-border/40 bg-card/60 p-3.5 transition-all hover:border-primary/35 hover:bg-card hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="flex items-start gap-3">
                <Avatar className="size-9 shrink-0 border border-border/50">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-[10px] font-bold bg-primary/8 text-primary">
                    {item.uploader.displayName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                      {matchReason}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">·</span>
                    <span className="text-[10px] font-mono font-bold text-foreground/80">
                      {item.subjectCode}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">·</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {resourceLabel}
                    </span>
                  </div>

                  <h4 className="mt-1.5 text-[14px] sm:text-[15px] font-extrabold leading-snug tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>

                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground/80 truncate max-w-[130px]">
                      {item.uploader.displayName}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>Sem {item.semester}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="truncate max-w-[140px]">{item.branch}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 font-semibold text-muted-foreground">
                      <ThumbsUp className="size-3" />
                      {item.upvotesCount} helpful
                    </span>
                    <span className="rounded-lg bg-muted px-2 py-1 font-semibold text-muted-foreground">
                      {item.downloadsCount} downloads
                    </span>
                    <span className="rounded-lg bg-primary/8 px-2 py-1 font-semibold text-primary">
                      {matchPercent}% syllabus match
                    </span>
                  </div>
                </div>

                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
