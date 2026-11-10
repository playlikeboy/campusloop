"use client";

import { GraduationCap } from "lucide-react";
import {
  BRANCHES,
  branchLabel,
  RESOURCE_TYPES,
  SEMESTERS,
  SORT_OPTIONS,
} from "@/components/academics/academic-filter-options";
import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AcademicFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  branch: string;
  semester: string;
  resourceType: string;
  sortBy: string;
  scope: "campus" | "global";
  activeTab: string;
  onScopeChange: (scope: "campus" | "global") => void;
  onBranchChange: (b: string) => void;
  onSemesterChange: (s: string) => void;
  onResourceTypeChange: (r: string) => void;
  onSortChange: (sort: any) => void;
  onReset: () => void;
  onOpenCourseModal: () => void;
}

const selectClass = cn(fieldClassName, "h-11 cursor-pointer");

/** Mobile bottom sheet holding every study material filter. */
export function AcademicFilterSheet(props: AcademicFilterSheetProps) {
  const { open, onOpenChange, activeCount, activeTab } = props;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>{activeCount ? `${activeCount} in use` : "Showing everything"}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <SegmentedControl
            aria-label="Whose material to show"
            fullWidth
            value={props.scope}
            onChange={(v) => {
              sounds.tap();
              props.onScopeChange(v);
            }}
            options={[
              { value: "campus", label: "My college" },
              { value: "global", label: "All colleges" },
            ]}
          />

          <div className="space-y-1.5">
            <Label htmlFor="filter-branch">Branch</Label>
            <select
              id="filter-branch"
              value={props.branch}
              onChange={(e) => props.onBranchChange(e.target.value)}
              className={selectClass}
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {branchLabel(b)}
                </option>
              ))}
            </select>
          </div>

          {activeTab !== "SAVED" && (
            <div className="space-y-1.5">
              <Label htmlFor="filter-semester">Semester</Label>
              <select
                id="filter-semester"
                value={props.semester}
                onChange={(e) => props.onSemesterChange(e.target.value)}
                className={selectClass}
              >
                {SEMESTERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "for_you" && (
            <div className="space-y-1.5">
              <Label htmlFor="filter-type">Type</Label>
              <select
                id="filter-type"
                value={props.resourceType}
                onChange={(e) => props.onResourceTypeChange(e.target.value)}
                className={selectClass}
              >
                {RESOURCE_TYPES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="filter-sort">Sort by</Label>
            <select
              id="filter-sort"
              value={props.sortBy}
              onChange={(e) => props.onSortChange(e.target.value)}
              className={selectClass}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={() => {
              sounds.tap();
              onOpenChange(false);
              props.onOpenCourseModal();
            }}
          >
            <GraduationCap aria-hidden="true" />
            Set my branch and subjects
          </Button>
        </SheetBody>
        <SheetFooter className="grid grid-cols-2">
          <Button
            variant="ghost"
            onClick={() => {
              sounds.tap();
              props.onReset();
            }}
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              sounds.tap();
              onOpenChange(false);
            }}
          >
            Show results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
