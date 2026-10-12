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

export function CampusPulseSection({
  trends,
  topDiscussions,
  onTopicClick,
}: CampusPulseSectionProps) {
  return (
    <section id="explore-pulse" className="space-y-3.5 scroll-mt-20">
      <div className="flex items-center gap-2 px-1">
        <Flame className="size-4.5 text-rose-500 shrink-0" />
        <h2 className="text-base font-bold tracking-tight text-foreground">Campus Pulse</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Trending Topics Column */}
        <div className="lg:col-span-5 rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 backdrop-blur-xs flex flex-col justify-between space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <TrendingUp className="size-3.5 text-primary" />
            <span>Trending Topics</span>
          </div>

          <div className="divide-y divide-border/20 space-y-1">
            {trends.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No active trends yet on campus.</p>
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
                    className="group flex items-center justify-between py-2.5 px-1 hover:bg-muted/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[11px] text-muted-foreground truncate">{item.category}</p>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                        <Hash className="size-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{cleanTag}</span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium shrink-0">
                      {item.formattedCount}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Top Discussions Column */}
        <div className="lg:col-span-7 rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 backdrop-blur-xs flex flex-col justify-between space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <MessageSquare className="size-3.5 text-violet-500" />
            <span>Top Discussions</span>
          </div>

          <div className="divide-y divide-border/20 space-y-1">
            {topDiscussions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No trending discussions yet today.</p>
            ) : (
              topDiscussions.slice(0, 6).map((d) => (
                <Link
                  key={d.id}
                  href={d.href}
                  className="group block py-2.5 px-1 hover:bg-muted/40 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="size-4.5 rounded-full">
                      {d.authorAvatar && <AvatarImage src={d.authorAvatar} alt={d.authorName} />}
                      <AvatarFallback className="text-[9px]">
                        {d.authorName?.slice(0, 1) || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] text-muted-foreground truncate">{d.category}</span>
                    <span className="text-[10px] text-muted-foreground/60 ml-auto shrink-0">
                      {d.timeAgo}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {d.headline}
                  </p>
                  <span className="text-[11px] text-muted-foreground font-medium mt-0.5 inline-block">
                    {d.postCount}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
