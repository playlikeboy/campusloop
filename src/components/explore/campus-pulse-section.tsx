"use client";

import { Flame, Hash, MessageSquare, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sounds } from "@/lib/sounds";

export interface PulseTrend {
  category: string;
  topic: string;
  postCount: number;
  formattedCount: string;
  href: string;
}

export interface PulseDiscussion {
  id: string;
  headline: string;
  category: string;
  timeAgo: string;
  postCount: string;
  authorName?: string;
  authorAvatar?: string | null;
  href: string;
}

interface CampusPulseSectionProps {
  trends: PulseTrend[];
  topDiscussions: PulseDiscussion[];
  onTopicClick?: (topic: string) => void;
}

export function CampusPulseSection({ trends, topDiscussions, onTopicClick }: CampusPulseSectionProps) {
  return (
    <section id="explore-pulse" aria-labelledby="explore-pulse-title" className="space-y-3 scroll-mt-20">
      <h2 id="explore-pulse-title" className="flex items-center gap-2 px-1 text-lg">
        <Flame className="size-5 text-fg-muted shrink-0" aria-hidden />
        Trending now
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Trending Topics Column */}
        <div className="lg:col-span-5 rounded-lg border border-border bg-surface p-4 sm:p-5 flex flex-col space-y-3">
          <h3 className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-fg-muted" aria-hidden />
            Tags
          </h3>

          <div className="divide-y divide-border">
            {trends.length === 0 ? (
              <p className="text-xs text-fg-muted py-3">Nothing trending yet.</p>
            ) : (
              trends.slice(0, 6).map((item, idx) => {
                const cleanTag = item.topic.replace(/^#/, "").trim();
                const targetHref =
                  item.href && !item.href.includes("explore?q=")
                    ? item.href
                    : `/hashtag/${encodeURIComponent(cleanTag.toLowerCase())}`;

                return (
                  <Link
                    key={item.topic + idx}
                    href={targetHref}
                    onClick={() => {
                      sounds.tap();
                      if (onTopicClick) {
                        onTopicClick(cleanTag);
                      }
                    }}
                    className="group flex items-center justify-between py-2.5 px-2 hover:bg-surface-muted rounded-sm transition-ui cursor-pointer"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs text-fg-muted truncate">{item.category}</p>
                      <p className="text-sm font-semibold text-fg group-hover:text-brand-text transition-ui flex items-center gap-1">
                        <Hash className="size-3 text-fg-muted shrink-0" />
                        <span className="truncate">{cleanTag}</span>
                      </p>
                    </div>
                    <span className="text-xs text-fg-muted font-medium shrink-0 tabular-nums">
                      {item.formattedCount}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Top Discussions Column */}
        <div className="lg:col-span-7 rounded-lg border border-border bg-surface p-4 sm:p-5 flex flex-col space-y-3">
          <h3 className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4 text-fg-muted" aria-hidden />
            Most discussed
          </h3>

          <div className="divide-y divide-border">
            {topDiscussions.length === 0 ? (
              <p className="text-xs text-fg-muted py-3">No busy posts yet today.</p>
            ) : (
              topDiscussions.slice(0, 6).map((d) => (
                <Link
                  key={d.id}
                  href={d.href}
                  className="group block py-2.5 px-2 hover:bg-surface-muted rounded-sm transition-ui"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="size-4.5 rounded-full">
                      {d.authorAvatar && <AvatarImage src={d.authorAvatar} alt={d.authorName} />}
                      <AvatarFallback className="text-xs">{d.authorName?.slice(0, 1) || "S"}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-fg-muted truncate">{d.category}</span>
                    <span className="text-xs text-fg-subtle ml-auto shrink-0">{d.timeAgo}</span>
                  </div>
                  <p className="text-sm font-semibold text-fg group-hover:text-brand-text transition-ui line-clamp-1">
                    {d.headline}
                  </p>
                  <span className="text-xs text-fg-muted font-medium mt-0.5 inline-block">{d.postCount}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
