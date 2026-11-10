"use client";

import { ChevronRight, Hash, PenTool, Users } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { QuestionSticker } from "@/components/ui/stickers";
import { useScrollIsolation } from "@/hooks/use-scroll-isolation";
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
  const scrollRef = useScrollIsolation<HTMLDivElement>();
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
    <div
      ref={scrollRef}
      className="no-scrollbar w-full shrink-0 space-y-6 pb-16 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
    >
      <QuestionSticker prompt="Got a story worth telling?" variant="flat">
        <p className="text-sm text-fg-muted">
          Your placement prep, an interview, a project or hostel life. Write it once and help the next batch.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/articles/new">
            <PenTool className="size-4" />
            Write an article
          </Link>
        </Button>
      </QuestionSticker>

      <section aria-labelledby="articles-topics" className="space-y-3">
        <h2 id="articles-topics" className="flex items-center gap-2 text-base text-fg">
          <Hash aria-hidden className="size-4 text-fg-subtle" />
          Popular tags
        </h2>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <Link
              key={t.tag}
              href={`/articles?tag=${encodeURIComponent(t.tag)}`}
              className="inline-flex h-8 items-center rounded-full bg-surface-muted px-3 text-xs font-medium text-fg-muted transition-ui hover:bg-surface-sunken hover:text-fg"
            >
              #{t.tag}
            </Link>
          ))}
        </div>
      </section>

      {topAuthors.length > 0 && (
        <section aria-labelledby="articles-writers" className="space-y-2">
          <h2 id="articles-writers" className="flex items-center gap-2 text-base text-fg">
            <Users aria-hidden className="size-4 text-fg-subtle" />
            Writers to follow
          </h2>
          <ul className="divide-y divide-border">
            {topAuthors.slice(0, 5).map((author) => {
              const handle = author.username.replace(/^@/, "");
              const count = author.articleCount || 1;
              return (
                <li key={author.id}>
                  <Link
                    href={`/@${handle}`}
                    className="group flex min-h-14 items-center gap-3 py-2 transition-ui"
                  >
                    <Avatar className="size-9 shrink-0">
                      <AvatarImage src={author.avatarUrl || ""} alt="" />
                      <AvatarFallback className="bg-surface-muted text-xs font-semibold text-fg">
                        {author.displayName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg group-hover:text-brand-text">
                        {author.displayName}
                      </span>
                      <span className="block truncate text-xs text-fg-muted">
                        @{handle} · {count} {count === 1 ? "article" : "articles"}
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-subtle" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <nav aria-label="Article links" className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-fg-muted">
        <Link href="/articles/dashboard" className="hover:text-fg hover:underline">
          My articles
        </Link>
        <Link href="/safety" className="hover:text-fg hover:underline">
          Writing rules
        </Link>
        <Link href="/contact" className="hover:text-fg hover:underline">
          Contact us
        </Link>
      </nav>
    </div>
  );
}
