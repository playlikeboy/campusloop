"use client";

import {
  ArrowRight,
  Crown,
  Flame,
  Medal,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { CuteSparkle } from "@/components/ui/cute-illustrations";
import type { CollegeItem } from "./college-hub-row";

export interface LeaderboardCollegeItem extends CollegeItem {
  points: number;
  studentCount: number;
  postCount: number;
  rank: number;
}

interface AllIndiaCollegePodiumProps {
  leaderboard: LeaderboardCollegeItem[];
  loading?: boolean;
  compact?: boolean;
  className?: string;
  onExploreMore?: () => void;
}

export function AllIndiaCollegePodium({
  leaderboard,
  loading = false,
  compact = false,
  className = "",
  onExploreMore,
}: AllIndiaCollegePodiumProps) {
  if (loading) {
    return (
      <div
        className={`overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-500/10 via-card to-card p-5 sm:p-7 shadow-xs ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-48 rounded-full bg-amber-500/20 animate-pulse" />
            <div className="h-3.5 w-64 rounded-full bg-muted/40 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-8 max-w-lg mx-auto">
          <div className="h-36 sm:h-44 rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-48 sm:h-60 rounded-2xl bg-muted/60 animate-pulse" />
          <div className="h-32 sm:h-38 rounded-2xl bg-muted/30 animate-pulse" />
        </div>
      </div>
    );
  }

  if (leaderboard.length < 3) {
    return null;
  }

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  // Difference in points between #1 and #2
  const leadMargin = first && second ? Math.max(0, first.points - second.points) : 0;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/12 via-card/95 to-card p-4 sm:p-7 shadow-xs transition-all select-none ${className}`}
    >
      {/* Decorative ambient gold flare */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-400/15 rounded-full blur-3xl opacity-75" aria-hidden="true" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Trophy className="size-3.5" />
            </div>
            <h2 className="font-heading text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span>All-India Campus Championship</span>
              <CuteSparkle size={14} className="text-amber-500" />
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Top campuses ranked live by verified student discourse, solved notes &amp; community clout.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Season 1 Live</span>
          </span>
          {leadMargin > 0 && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              Lead: <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">+{leadMargin.toLocaleString("en-IN")} LP</strong>
            </span>
          )}
        </div>
      </div>

      {/* ─── 3D Championship Podium ─── */}
      <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 items-end pt-6 sm:pt-8 max-w-xl mx-auto">
        {/* ── Rank 2: Silver Pedestal (Left) ── */}
        {second && (
          <Link
            href={`/college/${second.slug || second.id}`}
            className="group flex flex-col items-center min-w-0 cursor-pointer transition-transform hover:-translate-y-1.5 active:scale-95"
            aria-label={`Rank 2: ${second.name}`}
          >
            <div className="flex items-center gap-1 mb-1 text-slate-500 dark:text-slate-400 font-bold text-[10px] sm:text-xs">
              <Medal className="size-3.5 sm:size-4 shrink-0 text-slate-400" />
              <span>Silver</span>
            </div>

            {/* Silver Crest */}
            <div className="relative mb-2 shrink-0">
              <div className="size-14 sm:size-17 rounded-2xl border-2 border-slate-300 dark:border-slate-500 bg-card/90 shadow-sm overflow-hidden flex items-center justify-center p-1.5 ring-3 ring-slate-300/20 group-hover:border-primary transition-all">
                {second.logoUrl ? (
                  <img
                    src={second.logoUrl}
                    alt={second.name}
                    width={68}
                    height={68}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="size-full object-contain"
                  />
                ) : (
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                    {second.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="absolute -top-1.5 -right-1.5 size-5 sm:size-6 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-900 border border-slate-100 flex items-center justify-center font-black text-[10px] sm:text-[11px] shadow-sm">
                2
              </span>
            </div>

            {/* College Name */}
            <p className="font-heading text-xs sm:text-[13px] font-bold text-foreground text-center truncate w-full px-1 group-hover:text-primary transition-colors">
              {second.name.split(",")[0].replace(/Birla Institute of Technology/i, "BIT").replace(/Indian Institute of Technology/i, "IIT").replace(/National Institute of Technology/i, "NIT")}
            </p>

            {/* Points & Stats */}
            <div className="flex flex-col items-center text-center mt-0.5">
              <span className="text-[11px] sm:text-xs font-black text-foreground tabular-nums">
                {second.points.toLocaleString("en-IN")} LP
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Users className="size-2.5" />
                <span>{second.studentCount ? second.studentCount.toLocaleString("en-IN") : "Hub Active"}</span>
              </span>
            </div>

            {/* Silver 3D Pedestal Step */}
            <div
              className={`w-full mt-2.5 rounded-t-2xl bg-gradient-to-t from-slate-500/20 via-slate-400/25 to-slate-300/35 border-t-2 border-x border-slate-300/60 dark:border-slate-500/60 flex flex-col items-center justify-center text-center shadow-xs ${
                compact ? "h-16 sm:h-20" : "h-20 sm:h-24"
              }`}
            >
              <span className="font-mono text-base sm:text-lg font-black text-slate-700 dark:text-slate-200">#2</span>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400">Runner-Up</span>
            </div>
          </Link>
        )}

        {/* ── Rank 1: Gold Champion Pedestal (Center) ── */}
        {first && (
          <Link
            href={`/college/${first.slug || first.id}`}
            className="group flex flex-col items-center min-w-0 cursor-pointer transition-transform hover:-translate-y-2 active:scale-95 z-20 -mx-1 sm:mx-0"
            aria-label={`Rank 1 Champion: ${first.name}`}
          >
            {/* Glowing Golden Crown */}
            <div className="flex items-center gap-1 mb-1 text-amber-500 font-extrabold text-xs sm:text-sm animate-bounce">
              <Crown className="size-4 sm:size-5 fill-amber-400 text-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />
              <span className="tracking-wide">Leader</span>
            </div>

            {/* Gold Champion Crest */}
            <div className="relative mb-2 shrink-0">
              <div className="size-18 sm:size-22 rounded-3xl border-3 border-amber-400 bg-card shadow-md overflow-hidden flex items-center justify-center p-2 ring-4 ring-amber-400/25 group-hover:ring-amber-400/40 transition-all">
                {first.logoUrl ? (
                  <img
                    src={first.logoUrl}
                    alt={first.name}
                    width={88}
                    height={88}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="size-full object-contain"
                  />
                ) : (
                  <span className="text-sm sm:text-base font-black text-amber-500">
                    {first.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="absolute -top-1.5 -right-1.5 size-6 sm:size-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-amber-950 border border-amber-200 flex items-center justify-center font-black text-xs sm:text-[13px] shadow-md">
                1
              </span>
            </div>

            {/* College Name */}
            <p className="font-heading text-xs sm:text-sm font-extrabold text-foreground text-center truncate w-full px-1 group-hover:text-primary transition-colors">
              {first.name.split(",")[0].replace(/Birla Institute of Technology/i, "BIT").replace(/Indian Institute of Technology/i, "IIT").replace(/National Institute of Technology/i, "NIT")}
            </p>

            {/* Points & Stats */}
            <div className="flex flex-col items-center text-center mt-0.5">
              <span className="text-xs sm:text-[13px] font-black text-amber-500 tabular-nums">
                {first.points.toLocaleString("en-IN")} LP
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Users className="size-2.5 text-amber-500" />
                <span>{first.studentCount ? first.studentCount.toLocaleString("en-IN") : "Dominant Hub"}</span>
              </span>
            </div>

            {/* Gold 3D Pedestal Step (Tallest) */}
            <div
              className={`w-full mt-2.5 rounded-t-2xl bg-gradient-to-t from-amber-500/30 via-amber-400/25 to-amber-300/40 border-t-2 border-x border-amber-400/80 flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden ${
                compact ? "h-22 sm:h-28" : "h-26 sm:h-32"
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-amber-200/60" />
              <span className="font-mono text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-200 drop-shadow-xs">#1</span>
              <span className="text-[9px] sm:text-[11px] font-extrabold tracking-wider uppercase text-amber-900 dark:text-amber-100 flex items-center gap-1">
                <Trophy className="size-2.5 sm:size-3 text-amber-500" />
                <span>CHAMPION</span>
              </span>
            </div>
          </Link>
        )}

        {/* ── Rank 3: Bronze Pedestal (Right) ── */}
        {third && (
          <Link
            href={`/college/${third.slug || third.id}`}
            className="group flex flex-col items-center min-w-0 cursor-pointer transition-transform hover:-translate-y-1.5 active:scale-95"
            aria-label={`Rank 3: ${third.name}`}
          >
            <div className="flex items-center gap-1 mb-1 text-amber-800 dark:text-amber-400 font-bold text-[10px] sm:text-xs">
              <Medal className="size-3.5 sm:size-4 shrink-0 text-amber-700" />
              <span>Bronze</span>
            </div>

            {/* Bronze Crest */}
            <div className="relative mb-2 shrink-0">
              <div className="size-14 sm:size-17 rounded-2xl border-2 border-amber-700/60 bg-card/90 shadow-sm overflow-hidden flex items-center justify-center p-1.5 ring-3 ring-amber-700/20 group-hover:border-primary transition-all">
                {third.logoUrl ? (
                  <img
                    src={third.logoUrl}
                    alt={third.name}
                    width={68}
                    height={68}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="size-full object-contain"
                  />
                ) : (
                  <span className="text-xs font-black text-amber-800 dark:text-amber-400">
                    {third.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="absolute -top-1.5 -right-1.5 size-5 sm:size-6 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white border border-amber-400 flex items-center justify-center font-black text-[10px] sm:text-[11px] shadow-sm">
                3
              </span>
            </div>

            {/* College Name */}
            <p className="font-heading text-xs sm:text-[13px] font-bold text-foreground text-center truncate w-full px-1 group-hover:text-primary transition-colors">
              {third.name.split(",")[0].replace(/Birla Institute of Technology/i, "BIT").replace(/Indian Institute of Technology/i, "IIT").replace(/National Institute of Technology/i, "NIT")}
            </p>

            {/* Points & Stats */}
            <div className="flex flex-col items-center text-center mt-0.5">
              <span className="text-[11px] sm:text-xs font-black text-foreground tabular-nums">
                {third.points.toLocaleString("en-IN")} LP
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Users className="size-2.5" />
                <span>{third.studentCount ? third.studentCount.toLocaleString("en-IN") : "Active Hub"}</span>
              </span>
            </div>

            {/* Bronze 3D Pedestal Step */}
            <div
              className={`w-full mt-2.5 rounded-t-2xl bg-gradient-to-t from-amber-800/20 via-amber-700/25 to-amber-600/35 border-t-2 border-x border-amber-700/60 flex flex-col items-center justify-center text-center shadow-xs ${
                compact ? "h-14 sm:h-18" : "h-17 sm:h-21"
              }`}
            >
              <span className="font-mono text-base sm:text-lg font-black text-amber-800 dark:text-amber-300">#3</span>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-amber-800 dark:text-amber-400">3rd Place</span>
            </div>
          </Link>
        )}
      </div>

      {/* ─── Motivational Climb Banner (Visual Addiction Trigger) ─── */}
      <div className="relative z-10 mt-4 sm:mt-5 pt-3.5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-foreground font-semibold text-center sm:text-left">
          <Flame className="size-4 text-primary shrink-0 animate-pulse" />
          <span>
            Want your college crowned at #1? Upload notes (<strong className="text-primary">+50 LP</strong>) &amp; invite classmates (<strong className="text-primary">+25 LP</strong>)!
          </span>
        </div>

        {onExploreMore && (
          <button
            type="button"
            onClick={onExploreMore}
            className="text-primary font-bold hover:underline shrink-0 flex items-center gap-1 cursor-pointer self-center sm:self-auto"
          >
            <span>Full Standings</span>
            <ArrowRight className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}
