"use client";

import { RotateCcw, X } from "lucide-react";
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
  const activeChips: { label: string; onRemove: () => void; key: string }[] = [];

  if (branch !== "All") {
    activeChips.push({
      key: "branch",
      label: branch,
      onRemove: onClearBranch,
    });
  }

  if (semester !== "all") {
    activeChips.push({
      key: "semester",
      label: `Sem ${semester}`,
      onRemove: onClearSemester,
    });
  }

  if (resourceType !== "all") {
    const typeLabel =
      resourceType === "PYQ"
        ? "PYQs"
        : resourceType === "NOTES"
          ? "Notes"
          : resourceType.replace("_", " ");
    activeChips.push({
      key: "type",
      label: typeLabel,
      onRemove: onClearResourceType,
    });
  }

  if (sortBy !== "for_you") {
    const sortLabel =
      sortBy === "latest"
        ? "Latest"
        : sortBy === "popular"
          ? "Most Upvoted"
          : sortBy === "downloads"
            ? "Most Downloaded"
            : sortBy;
    activeChips.push({
      key: "sort",
      label: `Sort: ${sortLabel}`,
      onRemove: onClearSort,
    });
  }

  if (activeChips.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap pt-1 select-none", className)}>
      <span className="text-[11px] font-bold text-muted-foreground mr-1">Active:</span>

      {activeChips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold transition-all animate-in fade-in zoom-in-95 duration-150"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              haptics.light();
              chip.onRemove();
            }}
            className="size-4 rounded-full hover:bg-primary/20 flex items-center justify-center text-primary cursor-pointer transition-colors"
            title={`Remove ${chip.label} filter`}
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={() => {
          sounds.tap();
          haptics.light();
          onClearAll();
        }}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors ml-1 px-2 py-0.5 rounded-md hover:bg-muted/50"
      >
        <RotateCcw className="size-2.5" />
        <span>Clear all</span>
      </button>
    </div>
  );
}
