"use client";

import { Globe, Plus, School } from "lucide-react";
import Link from "next/link";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AcademicHeaderProps {
  scope: "campus" | "global";
  onScopeChange: (scope: "campus" | "global") => void;
  campusName?: string;
  totalCount?: number;
}

export function AcademicHeader({
  scope,
  onScopeChange,
  campusName = "Campus Hub",
  totalCount,
}: AcademicHeaderProps) {
  return (
    <header className="space-y-3.5 pt-2 pb-4">
      {/* Top Title & Primary Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Academics
            </h1>
            {typeof totalCount === "number" && totalCount > 0 && (
              <span className="hidden xs:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                {totalCount.toLocaleString()} resources
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
            Study materials, PYQs, notes and playlists shared by students.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          {/* Scope Switcher: Campus vs All Campuses */}
          <div className="flex items-center rounded-full bg-muted/60 p-0.5 border border-border/40 text-xs">
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                onScopeChange("campus");
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                scope === "campus"
                  ? "bg-card text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={`Scoped to ${campusName}`}
              aria-label="Filter to my campus"
            >
              <School className="size-3.5 text-primary" />
              <span className="max-w-[120px] truncate">{campusName.split(",")[0]}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                onScopeChange("global");
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                scope === "global"
                  ? "bg-card text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="All Indian engineering colleges"
              aria-label="Filter to all campuses"
            >
              <Globe className="size-3.5 text-sky-500" />
              <span>All India</span>
            </button>
          </div>

          {/* "+ Upload Notes" CTA */}
          <Link
            href="/academics/upload"
            onClick={() => {
              sounds.tap();
              haptics.success();
            }}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Upload Notes</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
