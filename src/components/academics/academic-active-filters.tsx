"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AcademicActiveFiltersProps {
  branch: string;
  semester: string;
  resourceType: string;
  sortBy: string;
  onClearBranch: () => void;
  onClearSemester: () => void;
  onClearResourceType: () => void;
  onClearSort: () => void;
  onClearAll: () => void;
  className?: string;
}

const TYPE_LABELS: Record<string, string> = {
  PYQ: "PYQs",
  NOTES: "Notes",
  CHEAT_SHEET: "Cheat sheets",
  LAB_MANUAL: "Lab manuals",
};

const SORT_LABELS: Record<string, string> = {
  latest: "Newest",
  popular: "Most upvoted",
  downloads: "Most downloaded",
  trending: "Popular now",
};

/** Removable chips for every filter in use, plus "Clear all". */
export function AcademicActiveFilters({
  branch,
  semester,
  resourceType,
  sortBy,
  onClearBranch,
  onClearSemester,
  onClearResourceType,
  onClearSort,
  onClearAll,
  className,
}: AcademicActiveFiltersProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (branch !== "All") chips.push({ key: "branch", label: branch, onRemove: onClearBranch });
  if (semester !== "all")
    chips.push({ key: "semester", label: `Sem ${semester}`, onRemove: onClearSemester });
  if (resourceType !== "all")
    chips.push({
      key: "type",
      label: TYPE_LABELS[resourceType] ?? resourceType.replace(/_/g, " ").toLowerCase(),
      onRemove: onClearResourceType,
    });
  if (sortBy !== "for_you")
    chips.push({ key: "sort", label: SORT_LABELS[sortBy] ?? sortBy, onRemove: onClearSort });

  if (chips.length === 0) return null;

  const tap = (fn: () => void) => () => {
    sounds.tap();
    haptics.light();
    fn();
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2 pt-2", className)}>
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          size="sm"
          selected
          onClick={tap(chip.onRemove)}
          onRemove={tap(chip.onRemove)}
          aria-label={`Remove filter: ${chip.label}`}
        >
          {chip.label}
        </Chip>
      ))}
      <Button variant="ghost" size="sm" onClick={tap(onClearAll)}>
        Clear all
      </Button>
    </div>
  );
}
