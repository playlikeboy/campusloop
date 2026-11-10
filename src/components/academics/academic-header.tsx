"use client";

import { Globe, School, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface AcademicHeaderProps {
  scope: "campus" | "global";
  onScopeChange: (scope: "campus" | "global") => void;
  campusName?: string;
  totalCount?: number;
}

export function AcademicHeader({ scope, onScopeChange, campusName, totalCount }: AcademicHeaderProps) {
  const shortCampus = campusName?.split(",")[0]?.trim();

  return (
    <header className="space-y-4 pt-2 pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-3xl text-fg sm:text-4xl">Study material</h1>
          <p className="text-sm text-fg-muted">
            Notes and past papers (PYQs) for your branch and semester.
            {typeof totalCount === "number" && totalCount > 0 && (
              <span className="tabular-nums"> {totalCount.toLocaleString("en-IN")} files.</span>
            )}
          </p>
        </div>

        <Button asChild size="md" className="shrink-0">
          <Link
            href="/academics/study-material/upload"
            onClick={() => {
              sounds.tap();
              haptics.success();
            }}
          >
            <Upload />
            <span className="hidden sm:inline">Upload notes</span>
            <span className="sm:hidden">Upload</span>
          </Link>
        </Button>
      </div>

      <SegmentedControl
        aria-label="Whose material to show"
        value={scope}
        onChange={(next) => {
          sounds.tap();
          haptics.light();
          onScopeChange(next);
        }}
        className="w-full sm:w-auto"
        fullWidth
        options={[
          {
            value: "campus",
            icon: <School />,
            label: <span className="max-w-[10rem] truncate">{shortCampus || "My college"}</span>,
          },
          { value: "global", icon: <Globe />, label: "All colleges" },
        ]}
      />
    </header>
  );
}
