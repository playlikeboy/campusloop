"use client";

import {
  ArrowRight,
  BookOpen,
  FolderPlus,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AcademicContextRailProps {
  onSelectTopic?: (topic: string) => void;
  collegeName?: string;
  userSemester?: number;
  userBranch?: string;
}

const POPULAR_THIS_WEEK = [
  {
    code: "CS302",
    name: "Database Management Systems",
    tag: "PYQ + Notes",
    views: "2.4k views",
  },
  {
    code: "CS201",
    name: "Data Structures & Algorithms",
    tag: "Exam Solved",
    views: "1.9k views",
  },
  {
    code: "CS303",
    name: "Operating Systems",
    tag: "Quantum Notes",
    views: "1.6k views",
  },
  {
    code: "MA101",
    name: "Engineering Mathematics I",
    tag: "Cheat Sheets",
    views: "1.2k views",
  },
];

const CURATED_PLAYLISTS = [
  {
    title: "CSE Sem 5 Complete Exam Bundle",
    count: "14 items",
    curator: "Shaswat Raj",
    slug: "cse-sem-5-complete-exam-bundle",
  },
  {
    title: "Operating Systems Core Concepts",
    count: "8 items",
    curator: "ACM Chapter",
    slug: "operating-systems-core-concepts",
  },
];

export function AcademicContextRail({
  onSelectTopic,
  collegeName = "BIT Mesra",
  userSemester = 5,
  userBranch = "Computer Science",
}: AcademicContextRailProps) {
  return (
    <aside className="hidden xl:flex flex-col gap-4.5 w-72 shrink-0 select-none sticky top-20">
      {/* ─── 1. Personalized Context Pill ─── */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Sparkles className="size-3.5 text-primary" />
          <span>Recommended for You</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Curated based on{" "}
          <strong className="text-foreground">Sem {userSemester} · {userBranch}</strong> at {collegeName.split(",")[0]}.
        </p>
      </div>

      {/* ─── 2. Popular This Week ─── */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="size-3.5 text-primary" />
            <span>Popular this week</span>
          </div>
        </div>

        <div className="space-y-1 divide-y divide-border/20 -mx-1">
          {POPULAR_THIS_WEEK.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                sounds.tap();
                if (onSelectTopic) onSelectTopic(item.code);
              }}
              className="w-full pt-2 first:pt-0 pb-1 px-1 flex items-start justify-between text-left hover:bg-muted/40 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                    {item.code}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">·</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground truncate mt-0.5">
                  {item.name}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">
                {item.views}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. Curated Study Stacks / Playlists ─── */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <FolderPlus className="size-3.5 text-indigo-400" />
            <span>Study Playlists</span>
          </div>
          <Link
            href="/academics/playlists/new"
            onClick={() => sounds.tap()}
            className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
          >
            + Create
          </Link>
        </div>

        <div className="space-y-2">
          {CURATED_PLAYLISTS.map((pl) => (
            <Link
              key={pl.slug}
              href={`/academics/playlists/${pl.slug}`}
              onClick={() => sounds.tap()}
              className="block p-2.5 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors group cursor-pointer"
            >
              <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {pl.title}
              </h4>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                <span>By {pl.curator}</span>
                <span className="font-mono font-medium">{pl.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
