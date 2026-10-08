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
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
              Notes &amp; PYQs
            </h1>
            {typeof totalCount === "number" && totalCount > 0 && (
              <span className="hidden xs:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--tint-notes)] text-[#1A4B8C] border border-[#1A4B8C]/15 dark:bg-[#1A2E4C] dark:text-[#90C2FF]">
                {totalCount.toLocaleString()} verified resources
              </span>
            )}
          </div>
          <p className="hidden sm:block text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
            Verified study materials, solved PYQs, notes and cheat sheets shared by students.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          {/* Scope Switcher: Campus vs All Campuses */}
          <div className="flex items-center rounded-full bg-[var(--surface-sunken)] p-0.5 border border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                onScopeChange("campus");
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                scope === "campus"
                  ? "bg-[var(--surface)] text-[var(--text)] font-semibold border border-[var(--border)] shadow-2xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)]"
              )}
              title={`Scoped to ${campusName}`}
              aria-label="Filter to my campus"
            >
              <School className="size-3.5 text-[var(--primary)]" />
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
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                scope === "global"
                  ? "bg-[var(--surface)] text-[var(--text)] font-semibold border border-[var(--border)] shadow-2xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)]"
              )}
              title="All Indian engineering colleges"
              aria-label="Filter to all campuses"
            >
              <Globe className="size-3.5 text-emerald-500" />
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
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-xs font-semibold text-white shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Upload Notes</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
