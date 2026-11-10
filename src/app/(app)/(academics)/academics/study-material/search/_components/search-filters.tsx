"use client";

import { Building2, Globe, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { BRANCHES, SEMESTERS, type SearchScope, type SearchSort, SORT_OPTIONS } from "./search-options";

export interface SearchFilterState {
  branch: string;
  semester: string;
  scope: SearchScope;
  sort: SearchSort;
}

export interface SearchFilterHandlers {
  setBranch: (v: string) => void;
  setSemester: (v: string) => void;
  setScope: (v: SearchScope) => void;
  setSort: (v: SearchSort) => void;
  reset: () => void;
}

interface FilterProps {
  filters: SearchFilterState;
  on: SearchFilterHandlers;
  hasQuery: boolean;
}

const feedback = () => {
  sounds.tap();
  haptics.light();
};

const SCOPE_OPTIONS = [
  { value: "global" as const, label: "All India", icon: <Globe className="size-4" aria-hidden="true" /> },
  {
    value: "campus" as const,
    label: "My college",
    icon: <Building2 className="size-4" aria-hidden="true" />,
  },
];

function FilterSelects({ filters, on, hasQuery, compact }: FilterProps & { compact?: boolean }) {
  const selectClass = cn(fieldClassName, compact ? "h-10 w-auto pr-8 text-sm" : "h-11");
  const fields = [
    {
      id: "branch",
      label: "Branch",
      value: filters.branch,
      onChange: on.setBranch,
      options: BRANCHES.map((b) => ({ value: b, label: b === "All" ? "All branches" : b })),
    },
    {
      id: "semester",
      label: "Semester",
      value: filters.semester,
      onChange: on.setSemester,
      options: SEMESTERS.map((s) => ({ value: s.id, label: s.label })),
    },
    {
      id: "sort",
      label: "Sort by",
      value: filters.sort,
      onChange: (v: string) => on.setSort(v as SearchSort),
      options: SORT_OPTIONS.filter((o) => hasQuery || !o.needsQuery),
    },
  ];

  return (
    <>
      {fields.map((f) => (
        <label key={f.id} className={cn(compact ? "shrink-0" : "block space-y-1.5")}>
          <span className={compact ? "sr-only" : "text-sm font-semibold text-fg"}>{f.label}</span>
          <select
            value={f.value}
            onChange={(e) => {
              feedback();
              f.onChange(e.target.value);
            }}
            className={selectClass}
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </>
  );
}

export function DesktopSearchFilters({
  filters,
  on,
  hasQuery,
  hasActive,
}: FilterProps & { hasActive: boolean }) {
  return (
    <div className="hidden items-center gap-2 overflow-x-auto pt-1 pb-0.5 no-scrollbar sm:flex">
      <SegmentedControl
        aria-label="Where to search"
        size="sm"
        options={SCOPE_OPTIONS}
        value={filters.scope}
        onChange={(v) => {
          feedback();
          on.setScope(v);
        }}
      />
      <FilterSelects filters={filters} on={on} hasQuery={hasQuery} compact />
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={on.reset} className="ml-auto shrink-0">
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset
        </Button>
      )}
    </div>
  );
}

export function MobileSearchFilterSheet({
  open,
  onOpenChange,
  filters,
  on,
  hasQuery,
  activeCount,
}: FilterProps & { open: boolean; onOpenChange: (open: boolean) => void; activeCount: number }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <p className="text-sm text-fg-muted">{activeCount ? `${activeCount} on` : "Showing everything"}</p>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-fg">Where</p>
            <SegmentedControl
              aria-label="Where to search"
              fullWidth
              options={SCOPE_OPTIONS}
              value={filters.scope}
              onChange={(v) => {
                feedback();
                on.setScope(v);
              }}
            />
          </div>
          <FilterSelects filters={filters} on={on} hasQuery={hasQuery} />
        </SheetBody>
        <SheetFooter className="grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={on.reset}>
            Reset all
          </Button>
          <Button onClick={() => onOpenChange(false)}>Show results</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
