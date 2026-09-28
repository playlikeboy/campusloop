"use client";

import {
  BookOpen,
  Building2,
  Calendar,
  GraduationCap,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface QuickCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  targetId: string;
}

const CATEGORIES: QuickCategory[] = [
  { id: "pulse", label: "Pulse", icon: Sparkles, targetId: "explore-pulse" },
  { id: "communities", label: "Communities", icon: Users, targetId: "explore-communities" },
  { id: "events", label: "Events", icon: Calendar, targetId: "explore-events" },
  { id: "academics", label: "Academics", icon: GraduationCap, targetId: "explore-academics" },
  { id: "articles", label: "Articles", icon: BookOpen, targetId: "explore-articles" },
  { id: "colleges", label: "Colleges", icon: Building2, targetId: "explore-colleges" },
  { id: "people", label: "People", icon: Users, targetId: "explore-people" },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag, targetId: "explore-marketplace" },
];

export function QuickExploreNav() {
  function handleScrollTo(targetId: string) {
    sounds.tap();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Explore
        </span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleScrollTo(cat.targetId)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-secondary/50 text-xs font-medium text-foreground/90 whitespace-nowrap",
                "hover:bg-secondary hover:text-foreground hover:border-border transition-colors cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              )}
            >
              <Icon className="size-3.5 text-muted-foreground" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
