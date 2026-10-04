"use client";

import {
  ArrowUpDown,
  BookOpen,
  Check,
  ChevronDown,
  Filter,
  GraduationCap,
  Layers,
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

  function toggleDropdown(id: string) {
    sounds.tap();
    haptics.light();
    setOpenDropdown(openDropdown === id ? null : id);
  }

  // Active filter count for badge
  const activeCount = [
    branch !== "All",
    semester !== "all",
    resourceType !== "all" && activeTab === "for_you",
    sortBy !== "for_you",
  ].filter(Boolean).length;

  return (
    <div ref={barRef} className="space-y-2 select-none">
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

      {/* ─── Mobile Filter Trigger (Opens Bottom Sheet) ─── */}
      <div className="flex sm:hidden items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            sounds.tap();
            haptics.light();
            setIsMobileSheetOpen(true);
          }}
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer",
            activeCount > 0
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/60 bg-card text-foreground shadow-2xs"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-black">
              {activeCount}
            </span>
          )}
        </button>

        {/* Quick Sort Pill on Mobile */}
        <select
          value={sortBy}
          onChange={(e) => {
            sounds.tap();
            onSortChange(e.target.value);
          }}
          className="h-8 rounded-full bg-card border border-border/60 px-3 text-xs font-semibold text-foreground outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Mobile Bottom Sheet Drawer ─── */}
      {isMobileSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm sm:hidden animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsMobileSheetOpen(false)} aria-hidden="true" />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter academic resources"
            className="relative z-10 w-full rounded-t-3xl border-t border-border/60 bg-card p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                <h3 className="text-sm font-black text-foreground">Filter Resources</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="flex size-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Branch Section */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground">Department / Branch</span>
              <div className="grid grid-cols-2 gap-1.5">
                {BRANCHES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      onBranchChange(b);
                    }}
                    className={cn(
                      "px-3 py-2 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer truncate",
                      branch === b
                        ? "border-primary bg-primary/15 text-primary font-bold"
                        : "border-border/40 bg-muted/30 text-foreground"
                    )}
                  >
                    {b === "All" ? "All Branches" : b}
                  </button>
                ))}
              </div>
            </div>

            {/* Semester Section */}
            {activeTab !== "SAVED" && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-foreground">Semester</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {SEMESTERS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        sounds.tap();
                        onSemesterChange(s.id);
                      }}
                      className={cn(
                        "py-2 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer",
                        semester === s.id
                          ? "border-primary bg-primary/15 text-primary font-bold"
                          : "border-border/40 bg-muted/30 text-foreground"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sheet Footer */}
            <div className="flex items-center gap-2 pt-3 border-t border-border/30">
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  onReset();
                }}
                className="flex-1 py-2.5 rounded-full border border-border/60 bg-muted/40 font-bold text-xs text-foreground text-center"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  setIsMobileSheetOpen(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-primary font-bold text-xs text-primary-foreground text-center shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
