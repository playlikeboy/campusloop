"use client";

import {
  BookOpen,
  Building2,
  Calendar,
  GraduationCap,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Chip } from "@/components/ui/chip";

const CATEGORIES = [
  { id: "pulse", label: "Trending", icon: TrendingUp, targetId: "explore-pulse" },
  { id: "communities", label: "Communities", icon: Users, targetId: "explore-communities" },
  { id: "events", label: "Events", icon: Calendar, targetId: "explore-events" },
  { id: "academics", label: "Study material", icon: GraduationCap, targetId: "explore-academics" },
  { id: "articles", label: "Articles", icon: BookOpen, targetId: "explore-articles" },
  { id: "colleges", label: "Colleges", icon: Building2, targetId: "explore-colleges" },
  { id: "people", label: "People", icon: UserPlus, targetId: "explore-people" },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag, targetId: "explore-marketplace" },
];

/** Chips that jump to a section further down Explore. */
export function QuickExploreNav() {
  function scrollToSection(targetId: string) {
    const element = document.getElementById(targetId);
    if (!element) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Jump to a section"
      className="-mx-3 flex gap-2 overflow-x-auto no-scrollbar px-3 py-0.5 sm:mx-0 sm:px-0"
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Chip key={cat.id} icon={<Icon aria-hidden />} onClick={() => scrollToSection(cat.targetId)}>
            {cat.label}
          </Chip>
        );
      })}
    </nav>
  );
}
