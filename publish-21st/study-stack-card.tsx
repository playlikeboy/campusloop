"use client";

import * as React from "react";
import { BookOpen, Eye, FolderPlus, Layers, Sparkles, Star } from "lucide-react";

export interface StudyStackResource {
  id: string;
  title: string;
  category: string;
  semester?: number;
  branch: string;
  itemCount: number;
  viewsCount: number;
  starsCount: number;
  coverGradient?: string;
  curatorName: string;
  curatorCollege: string;
  isVerified?: boolean;
}

export interface StudyStackCardProps {
  stack?: StudyStackResource;
  onStarToggle?: (isStarred: boolean, newCount: number) => void;
  className?: string;
}

const DEFAULT_STACK: StudyStackResource = {
  id: "stack-cs-301",
  title: "Operating Systems & Concurrency Mastery Pack",
  category: "Semester Pack",
  semester: 5,
  branch: "Computer Science",
  itemCount: 16,
  viewsCount: 2840,
  starsCount: 342,
  coverGradient: "from-blue-600 via-indigo-600 to-purple-700",
  curatorName: "Aarav Sharma",
  curatorCollege: "IIT Delhi",
  isVerified: true,
};

export function StudyStackCard({
  stack = DEFAULT_STACK,
  onStarToggle,
  className = "",
}: StudyStackCardProps) {
  const [stars, setStars] = React.useState(stack.starsCount);
  const [isStarred, setIsStarred] = React.useState(false);

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isStarred;
    const nextCount = nextState ? stars + 1 : Math.max(0, stars - 1);
    setIsStarred(nextState);
    setStars(nextCount);
    onStarToggle?.(nextState, nextCount);
  };

  return (
    <div className={`relative group w-full max-w-sm select-none ${className}`}>
      {/* Background stacked layers for depth */}
      <div className="absolute inset-x-4 -top-2.5 h-12 rounded-3xl bg-muted/40 transition-transform duration-300 group-hover:-translate-y-1" />
      <div className="absolute inset-x-2 -top-1.5 h-12 rounded-3xl bg-muted/60 transition-transform duration-300 group-hover:-translate-y-0.5" />

      {/* Main Front Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card text-card-foreground shadow-xl transition-all duration-300 group-hover:border-border group-hover:shadow-2xl">
        {/* Gradient Cover Header */}
        <div
          className={`relative h-32 w-full bg-gradient-to-tr ${
            stack.coverGradient || "from-emerald-600 to-teal-700"
          } p-4 text-white flex flex-col justify-between`}
        >
          {/* Top Chips */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 rounded-full bg-black/25 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
              <Layers className="size-3" />
              <span>{stack.category}</span>
            </span>

            <button
              type="button"
              onClick={handleStar}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black backdrop-blur-md transition-all cursor-pointer ${
                isStarred
                  ? "bg-amber-400 text-stone-900 shadow-md scale-105"
                  : "bg-black/30 text-white hover:bg-black/40 active:scale-95"
              }`}
            >
              <Star className={`size-3.5 ${isStarred ? "fill-stone-900" : ""}`} />
              <span className="font-mono tabular-nums">{stars}</span>
            </button>
          </div>

          {/* Branch & Semester Badge */}
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-white/20 px-2 py-0.5 text-[11px] font-bold backdrop-blur-xs">
              {stack.branch}
            </span>
            {stack.semester && (
              <span className="rounded-lg bg-black/20 px-2 py-0.5 text-[11px] font-semibold">
                Sem {stack.semester}
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-4">
          <h3 className="font-black text-foreground text-base leading-snug line-clamp-2 transition-colors group-hover:text-primary">
            {stack.title}
          </h3>

          {/* Stats Bar */}
          <div className="flex items-center justify-between border-y border-border/40 py-2.5 text-xs text-muted-foreground font-semibold">
            <div className="flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-primary" />
              <span>
                <strong className="text-foreground font-bold">{stack.itemCount}</strong> Solved Papers & Notes
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Eye className="size-3.5" />
              <span className="font-mono">{stack.viewsCount.toLocaleString()}</span>
            </div>
          </div>

          {/* Curator Footnote */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary font-black text-xs">
                {stack.curatorName.charAt(0)}
              </div>
              <div className="text-xs">
                <span className="block font-bold text-foreground leading-tight flex items-center gap-1">
                  {stack.curatorName}
                  {stack.isVerified && <Sparkles className="size-3 text-amber-500 inline" />}
                </span>
                <span className="text-[10px] text-muted-foreground">{stack.curatorCollege}</span>
              </div>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 rounded-full bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <FolderPlus className="size-3" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
