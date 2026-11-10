"use client";

import { cn } from "@/lib/utils";

export type ProfileTab = "posts" | "photos" | "articles" | "academics" | "clout" | "archived";

export function tabFromParam(param?: string | null): ProfileTab | null {
  if (param === "academics" || param === "notes") return "academics";
  if (param === "articles") return "articles";
  if (param === "photos" || param === "gallery") return "photos";
  if (param === "clout" || param === "perks" || param === "points") return "clout";
  if (param === "archived") return "archived";
  if (param === "posts") return "posts";
  return null;
}

interface ProfileTabBarProps {
  tabs: { id: ProfileTab; label: string; count?: number }[];
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

/** Underline tabs that stick under the app top bar. Solid surface, no blur. */
export function ProfileTabBar({ tabs, active, onChange }: ProfileTabBarProps) {
  return (
    <div className="sticky top-14 z-20 border-b border-border bg-bg">
      <div role="tablist" aria-label="Profile sections" className="no-scrollbar flex overflow-x-auto px-2">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`profile-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={isActive ? `profile-panel-${tab.id}` : undefined}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                e.preventDefault();
                const i = tabs.findIndex((t) => t.id === tab.id);
                const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
                onChange(next.id);
                document.getElementById(`profile-tab-${next.id}`)?.focus();
              }}
              onClick={() => onChange(tab.id)}
              className={cn(
                "-mb-px inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 text-sm transition-ui outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-brand font-semibold text-fg"
                  : "border-transparent font-medium text-fg-muted hover:text-fg"
              )}
            >
              {tab.label}
              {tab.count ? (
                <span className="rounded-full bg-surface-muted px-1.5 text-xs tabular-nums text-fg-muted">
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
