"use client";

import { Chip } from "@/components/ui/chip";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface AcademicTabItem {
  id: string;
  label: string;
}

interface AcademicNavTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  savedCount?: number;
  className?: string;
}

const TABS: AcademicTabItem[] = [
  { id: "for_you", label: "For you" },
  { id: "TRENDING", label: "Popular now" },
  { id: "NOTES", label: "Notes" },
  { id: "PYQ", label: "PYQs" },
  { id: "PLAYLISTS", label: "Playlists" },
  { id: "SAVED", label: "Saved" },
];

/** View switcher for the study material feed. One chip is always selected. */
export function AcademicNavTabs({ activeTab, onTabChange, savedCount, className }: AcademicNavTabsProps) {
  return (
    <fieldset
      className={cn(
        "-mx-4 m-0 flex min-w-0 gap-2 overflow-x-auto border-0 px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0",
        className
      )}
    >
      <legend className="sr-only">Show</legend>
      {TABS.map((tab) => {
        const selected = activeTab === tab.id;
        const count = tab.id === "SAVED" && savedCount ? savedCount : undefined;
        return (
          <Chip
            key={tab.id}
            selected={selected}
            count={count}
            onClick={() => {
              if (selected) return;
              sounds.tap();
              haptics.light();
              onTabChange(tab.id);
            }}
          >
            {tab.label}
          </Chip>
        );
      })}
    </fieldset>
  );
}
