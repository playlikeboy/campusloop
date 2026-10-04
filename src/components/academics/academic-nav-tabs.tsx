"use client";

import { Bookmark, FileText, FolderOpen, GraduationCap, Sparkles } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface AcademicTabItem {
  id: string;
  label: string;
  icon: any;
  count?: number;
}

interface AcademicNavTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  savedCount?: number;
}

const TABS: AcademicTabItem[] = [
  { id: "for_you", label: "For You", icon: Sparkles },
  { id: "NOTES", label: "Notes", icon: FileText },
  { id: "PYQ", label: "PYQs", icon: GraduationCap },
  { id: "PLAYLISTS", label: "Playlists", icon: FolderOpen },
  { id: "SAVED", label: "Saved", icon: Bookmark },
];

export function AcademicNavTabs({ activeTab, onTabChange, savedCount }: AcademicNavTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Academics content sections"
      className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar border-b border-border/30 pb-2 select-none"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isSelected = activeTab === tab.id;
        const count = tab.id === "SAVED" ? savedCount : undefined;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isSelected}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            type="button"
            onClick={() => {
              sounds.tap();
              haptics.light();
              onTabChange(tab.id);
            }}
            className={cn(
              "group relative inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap",
              isSelected
                ? "bg-foreground text-background shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon
              className={cn(
                "size-3.5 sm:size-4 transition-colors",
                isSelected ? "text-background" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span>{tab.label}</span>
            {typeof count === "number" && count > 0 && (
              <span
                className={cn(
                  "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  isSelected ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
