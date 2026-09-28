"use client";

import { ArrowUpRight, BookOpen, Flame, PenTool, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetcher } from "@/lib/api";

interface TopAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  points: number;
  articleCount?: number;
}

interface TrendingTopic {
  tag: string;
  count: number;
}

const DEFAULT_TOPICS = [
  { tag: "placements", count: 0 },
  { tag: "internships", count: 0 },
  { tag: "dsa", count: 0 },
  { tag: "webdev", count: 0 },
  { tag: "research", count: 0 },
  { tag: "campuslife", count: 0 },
];

export function ArticlesRightSidebar() {
  const { data: topAuthorsData } = useSWR<{ authors: TopAuthor[] }>("/api/articles/top-authors", fetcher, {
    dedupingInterval: 60000,
  });

  const { data: topicsData } = useSWR<{ topics: TrendingTopic[] }>("/api/articles/trending-topics", fetcher, {
    dedupingInterval: 60000,
  });

  const topAuthors = topAuthorsData?.authors || [];
  const rawTopics = topicsData?.topics || [];
  const topics = rawTopics.length > 0 ? rawTopics : DEFAULT_TOPICS;

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-6">
      {/* ─── Write For CampusLoop Callout ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-background p-5 shadow-xs">
        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary tracking-wide">
            <Sparkles className="size-3.5" />
            <span>Student Publications</span>
          </div>
          <h3 className="text-base font-bold text-foreground tracking-tight leading-snug">
            Write placement roadmaps &amp; guides
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Share your interview debriefs, tech deep-dives, and campus insights with students across 1,350+
            colleges.
          </p>
          <div className="pt-2">
            <Link
              href="/articles/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs"
            >
              <PenTool className="size-3.5" />
              <span>Start Writing</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Trending Campus Topics ─── */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <Flame className="size-4 text-orange-500" />
          <span>Trending Topics</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {topics.map((t) => (
            <Link
              key={t.tag}
              href={`/articles?tag=${encodeURIComponent(t.tag)}`}
              className="px-2.5 py-1 rounded-lg border border-border/50 bg-muted/40 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              #{t.tag}
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Top Campus Writers ─── */}
      {topAuthors.length > 0 && (
        <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Users className="size-4 text-primary" />
              <span>Top Student Authors</span>
            </div>
          </div>

          <div className="divide-y divide-border/20 pt-1">
            {topAuthors.slice(0, 5).map((author) => (
              <div
                key={author.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <Link href={`/${author.username}`} className="flex items-center gap-2.5 min-w-0 group">
                  <Avatar className="size-8 border border-border/40 shrink-0">
                    <AvatarImage src={author.avatarUrl || ""} />
                    <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                      {author.displayName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {author.displayName}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate">
                      @{author.username} · {author.articleCount || 1}{" "}
                      {author.articleCount === 1 ? "article" : "articles"}
                    </p>
                  </div>
                </Link>

                <Link
                  href={`/${author.username}`}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="View author profile"
                >
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Editorial Guidelines ─── */}
      <div className="rounded-2xl border border-border/40 bg-card/40 p-4 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <BookOpen className="size-3.5 text-primary" />
          <span>Campus Editorial Rules</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Original placement experiences, tech articles, and verified student insights. High signal, zero
          spam.
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px] font-semibold text-muted-foreground">
          <Link href="/safety" className="hover:text-foreground hover:underline">
            Guidelines
          </Link>
          <Link href="/articles/dashboard" className="hover:text-foreground hover:underline">
            Dashboard
          </Link>
          <Link href="/contact" className="hover:text-foreground hover:underline">
            Support
          </Link>
        </div>
      </div>
    </aside>
  );
}
