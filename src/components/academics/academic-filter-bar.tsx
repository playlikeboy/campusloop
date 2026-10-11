"use client";

import {
  ArrowUpDown,
  Check,
  ChevronDown,
  GraduationCap,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export const BRANCHES = [
  "All",
  "Computer Science",
  "Information Technology",
  "ECE",
  "Electrical",
  "Mechanical",
  "Civil",
  "Chemical",
  "BioTech",
  "Basic Sciences",
] as const;

export const SEMESTERS = [
  { id: "all", label: "All Semesters" },
  { id: "1", label: "Sem 1" },
  { id: "2", label: "Sem 2" },
  { id: "3", label: "Sem 3" },
  { id: "4", label: "Sem 4" },
  { id: "5", label: "Sem 5" },
  { id: "6", label: "Sem 6" },
  { id: "7", label: "Sem 7" },
  { id: "8", label: "Sem 8" },
] as const;

export const RESOURCE_TYPES = [
  { id: "all", label: "All Types" },
  { id: "NOTES", label: "Notes" },
  { id: "PYQ", label: "PYQs (Exam Papers)" },
  { id: "CHEAT_SHEET", label: "Formula Cheat Sheets" },
  { id: "LAB_MANUAL", label: "Lab Manuals" },
  { id: "SYLLABUS", label: "Syllabus & Core" },
] as const;

export const SORT_OPTIONS = [
  { id: "for_you", label: "Recommended" },
  { id: "latest", label: "Latest First" },
  { id: "popular", label: "Most Upvoted" },
  { id: "downloads", label: "Most Downloaded" },
] as const;

interface AcademicFilterBarProps {
  branch: string;
  semester: string;
  resourceType: string;
  sortBy: string;
  onBranchChange: (b: string) => void;
  onSemesterChange: (s: string) => void;
  onResourceTypeChange: (r: string) => void;
  onSortChange: (sort: any) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  activeTab: string;
  scope: "campus" | "global";
  onScopeChange: (scope: "campus" | "global") => void;
  campusName?: string;
  onOpenCourseModal: () => void;
}

export function AcademicFilterBar({
  branch,
  semester,
  resourceType,
  sortBy,
  onBranchChange,
  onSemesterChange,
  onResourceTypeChange,
  onSortChange,
  onReset,
  hasActiveFilters,
  activeTab,
  scope,
  onScopeChange,
  campusName = "My campus",
  onOpenCourseModal,
}: AcademicFilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobileSheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileSheetOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileSheetOpen]);

  function toggleDropdown(id: string) {
    sounds.tap();
    haptics.light();
    setOpenDropdown(openDropdown === id ? null : id);
  }

  // Active filter count for badge
  const activeCount = [
    scope !== "campus",
    branch !== "All",
    semester !== "all",
    resourceType !== "all" && activeTab === "for_you",
    sortBy !== "for_you",
  ].filter(Boolean).length;

  return (
    <div ref={barRef} className="relative space-y-2 select-none">
      {/* ─── Desktop Filter Bar (Compact Popovers) ─── */}
      <div className="hidden sm:flex items-center justify-between gap-2 flex-wrap pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Branch Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("branch")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                branch !== "All"
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                  : "border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              aria-expanded={openDropdown === "branch"}
            >
              <span>{branch === "All" ? "Branch" : branch}</span>
              <ChevronDown className={cn("size-3 transition-transform", openDropdown === "branch" && "rotate-180")} />
            </button>

            {openDropdown === "branch" && (
              <div className="absolute top-full left-0 mt-1.5 z-40 w-52 rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-xl p-1.5 animate-in fade-in zoom-in-95 duration-150 space-y-0.5 max-h-64 overflow-y-auto">
                {BRANCHES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      onBranchChange(b);
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer",
                      branch === b ? "bg-primary/15 text-primary font-bold" : "hover:bg-muted/70 text-foreground"
                    )}
                  >
                    <span>{b === "All" ? "All Branches" : b}</span>
                    {branch === b && <Check className="size-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Semester Dropdown */}
          {activeTab !== "SAVED" && (
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("semester")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                  semester !== "all"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                    : "border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                aria-expanded={openDropdown === "semester"}
              >
                <span>{semester === "all" ? "Semester" : `Sem ${semester}`}</span>
                <ChevronDown className={cn("size-3 transition-transform", openDropdown === "semester" && "rotate-180")} />
              </button>

              {openDropdown === "semester" && (
                <div className="absolute top-full left-0 mt-1.5 z-40 w-44 rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-xl p-1.5 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                  {SEMESTERS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        sounds.tap();
                        onSemesterChange(s.id);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer",
                        semester === s.id ? "bg-primary/15 text-primary font-bold" : "hover:bg-muted/70 text-foreground"
                      )}
                    >
                      <span>{s.label}</span>
                      {semester === s.id && <Check className="size-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Resource Type Dropdown (when on For You tab) */}
          {activeTab === "for_you" && (
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("type")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                  resourceType !== "all"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                    : "border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                aria-expanded={openDropdown === "type"}
              >
                <span>{resourceType === "all" ? "Resource Type" : RESOURCE_TYPES.find((r) => r.id === resourceType)?.label}</span>
                <ChevronDown className={cn("size-3 transition-transform", openDropdown === "type" && "rotate-180")} />
              </button>

              {openDropdown === "type" && (
                <div className="absolute top-full left-0 mt-1.5 z-40 w-52 rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-xl p-1.5 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                  {RESOURCE_TYPES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        sounds.tap();
                        onResourceTypeChange(r.id);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer",
                        resourceType === r.id ? "bg-primary/15 text-primary font-bold" : "hover:bg-muted/70 text-foreground"
                      )}
                    >
                      <span>{r.label}</span>
                      {resourceType === r.id && <Check className="size-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("sort")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                sortBy !== "for_you"
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                  : "border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              aria-expanded={openDropdown === "sort"}
            >
              <ArrowUpDown className="size-3" />
              <span>Sort: {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}</span>
              <ChevronDown className={cn("size-3 transition-transform", openDropdown === "sort" && "rotate-180")} />
            </button>

            {openDropdown === "sort" && (
              <div className="absolute top-full left-0 mt-1.5 z-40 w-44 rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-xl p-1.5 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      onSortChange(s.id);
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer",
                      sortBy === s.id ? "bg-primary/15 text-primary font-bold" : "hover:bg-muted/70 text-foreground"
                    )}
                  >
                    <span>{s.label}</span>
                    {sortBy === s.id && <Check className="size-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.tap();
            haptics.light();
            onOpenCourseModal();
          }}
          className="hidden sm:inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Set your courses and academic focus"
        >
          <GraduationCap className="size-3.5" />
          <span>Courses</span>
        </button>

        {/* Clear Filters on Right */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              haptics.light();
              onReset();
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-muted/50"
          >
            <RotateCcw className="size-3" />
            <span>Clear filters</span>
          </button>
        )}
      </div>

      {/* One mobile filter control; every option lives in the sheet below. */}
      <div className="absolute -top-10 right-0 z-10 sm:hidden">
        <button
          type="button"
          onClick={() => {
            sounds.tap();
            haptics.light();
            setIsMobileSheetOpen(true);
          }}
          className={cn(
            "relative inline-flex size-10 items-center justify-center rounded-xl transition-colors",
            activeCount > 0
              ? "bg-primary/10 text-primary"
              : "bg-muted/40 text-muted-foreground hover:bg-muted"
          )}
          title="Filters"
          aria-label={"Open academic filters" + (activeCount ? ", " + activeCount + " active" : "")}
          aria-haspopup="dialog"
          aria-expanded={isMobileSheetOpen}
        >
          <SlidersHorizontal className="size-5" aria-hidden="true" />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {isMobileSheetOpen && (
        <div className="fixed inset-0 z-[100] sm:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setIsMobileSheetOpen(false)}
            aria-label="Close filters"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="academics-filter-title"
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border/50 bg-card px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/25" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 id="academics-filter-title" className="text-base font-bold text-foreground">Filters</h2>
                <p className="text-xs text-muted-foreground">
                  {activeCount ? activeCount + " active" : "All resources"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                aria-label="Close filters"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Campus</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { sounds.tap(); onScopeChange("campus"); }}
                    aria-pressed={scope === "campus"}
                    title={"Filter to " + campusName}
                    className={cn(
                      "min-h-10 rounded-xl border px-3 text-sm font-medium transition-colors",
                      scope === "campus" ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-muted/30 text-foreground"
                    )}
                  >
                    My campus
                  </button>
                  <button
                    type="button"
                    onClick={() => { sounds.tap(); onScopeChange("global"); }}
                    aria-pressed={scope === "global"}
                    className={cn(
                      "min-h-10 rounded-xl border px-3 text-sm font-medium transition-colors",
                      scope === "global" ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-muted/30 text-foreground"
                    )}
                  >
                    All India
                  </button>
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Branch</span>
                <select
                  value={branch}
                  onChange={(event) => { sounds.tap(); onBranchChange(event.target.value); }}
                  className="h-11 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground outline-none focus-visible:border-primary/50"
                >
                  {BRANCHES.map((item) => (
                    <option key={item} value={item}>{item === "All" ? "All branches" : item}</option>
                  ))}
                </select>
              </label>

              {activeTab !== "SAVED" && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Semester</span>
                  <select
                    value={semester}
                    onChange={(event) => { sounds.tap(); onSemesterChange(event.target.value); }}
                    className="h-11 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground outline-none focus-visible:border-primary/50"
                  >
                    {SEMESTERS.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </label>
              )}

              {activeTab === "for_you" && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Resource type</span>
                  <select
                    value={resourceType}
                    onChange={(event) => { sounds.tap(); onResourceTypeChange(event.target.value); }}
                    className="h-11 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground outline-none focus-visible:border-primary/50"
                  >
                    {RESOURCE_TYPES.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(event) => { sounds.tap(); onSortChange(event.target.value); }}
                  className="h-11 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground outline-none focus-visible:border-primary/50"
                >
                  {SORT_OPTIONS.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setIsMobileSheetOpen(false);
                  onOpenCourseModal();
                }}
                className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-muted/40 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <GraduationCap className="size-4 text-primary" />
                Courses &amp; focus
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border/30 pt-3">
              <button
                type="button"
                onClick={() => { sounds.tap(); onReset(); }}
                className="min-h-11 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
              >
                Reset all
              </button>
              <button
                type="button"
                onClick={() => { sounds.tap(); setIsMobileSheetOpen(false); }}
                className="min-h-11 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
