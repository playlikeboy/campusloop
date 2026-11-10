"use client";

import { ChevronDown, GraduationCap, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import {
  BRANCHES,
  branchLabel,
  RESOURCE_TYPES,
  SEMESTERS,
  SORT_OPTIONS,
} from "@/components/academics/academic-filter-options";
import { AcademicFilterSheet } from "@/components/academics/academic-filter-sheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export {
  BRANCHES,
  RESOURCE_TYPES,
  SEMESTERS,
  SORT_OPTIONS,
} from "@/components/academics/academic-filter-options";

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

/** A native select dressed as a pill. Selected state fills violet like a Chip. */
function PillSelect({
  label,
  value,
  active,
  onChange,
  children,
}: {
  label: string;
  value: string;
  active: boolean;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => {
          sounds.tap();
          onChange(e.target.value);
        }}
        className={cn(
          "h-10 cursor-pointer appearance-none rounded-full pr-9 pl-4 text-sm font-medium transition-ui outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "bg-brand text-brand-fg" : "bg-surface-muted text-fg hover:bg-surface-sunken"
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2",
          active ? "text-brand-fg" : "text-fg-muted"
        )}
      />
    </label>
  );
}

const QUICK_SEMESTERS = SEMESTERS.filter((s) => s.id !== "all");

export function AcademicFilterBar(props: AcademicFilterBarProps) {
  const {
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
    onOpenCourseModal,
  } = props;
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCount = [
    scope !== "campus",
    branch !== "All",
    semester !== "all",
    resourceType !== "all" && activeTab === "for_you",
    sortBy !== "for_you",
  ].filter(Boolean).length;

  return (
    <div>
      {/* Mobile: Filters button plus a one-tap semester row. */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:hidden">
        <Chip
          selected={activeCount > 0}
          count={activeCount || undefined}
          icon={<SlidersHorizontal />}
          aria-haspopup="dialog"
          onClick={() => {
            sounds.tap();
            haptics.light();
            setSheetOpen(true);
          }}
        >
          Filters
        </Chip>
        {activeTab !== "SAVED" &&
          QUICK_SEMESTERS.map((s) => (
            <Chip
              key={s.id}
              selected={semester === s.id}
              onClick={() => {
                sounds.tap();
                onSemesterChange(semester === s.id ? "all" : s.id);
              }}
            >
              {s.label}
            </Chip>
          ))}
      </div>

      {/* Desktop: one pill select per filter. */}
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <PillSelect label="Branch" value={branch} active={branch !== "All"} onChange={onBranchChange}>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>
              {branchLabel(b)}
            </option>
          ))}
        </PillSelect>
        {activeTab !== "SAVED" && (
          <PillSelect
            label="Semester"
            value={semester}
            active={semester !== "all"}
            onChange={onSemesterChange}
          >
            {SEMESTERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </PillSelect>
        )}
        {activeTab === "for_you" && (
          <PillSelect
            label="Type"
            value={resourceType}
            active={resourceType !== "all"}
            onChange={onResourceTypeChange}
          >
            {RESOURCE_TYPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </PillSelect>
        )}
        <PillSelect label="Sort by" value={sortBy} active={sortBy !== "for_you"} onChange={onSortChange}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id === "for_you" ? "Sort: for you" : s.label}
            </option>
          ))}
        </PillSelect>

        <div className="ml-auto flex items-center gap-1">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                sounds.tap();
                haptics.light();
                onReset();
              }}
            >
              Reset
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              sounds.tap();
              onOpenCourseModal();
            }}
          >
            <GraduationCap aria-hidden="true" />
            My subjects
          </Button>
        </div>
      </div>

      <AcademicFilterSheet
        {...props}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        activeCount={activeCount}
      />
    </div>
  );
}
