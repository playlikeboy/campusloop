import type { LucideIcon } from "lucide-react";
import { Building2, Car, PackageSearch, Tag } from "lucide-react";

export type BoardTab = "rides" | "housing" | "lost-found" | "sell";

export const BOARD_TABS: { id: BoardTab; label: string; icon: LucideIcon }[] = [
  { id: "rides", label: "Rides", icon: Car },
  { id: "housing", label: "Housing", icon: Building2 },
  { id: "lost-found", label: "Lost & found", icon: PackageSearch },
  { id: "sell", label: "Buy & sell", icon: Tag },
];

export const DEFAULT_BOARD_TAB: BoardTab = "rides";

/** Reads `?tab=`; anything unknown falls back to Rides. */
export function parseBoardTab(value: string | string[] | undefined | null): BoardTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return BOARD_TABS.some((t) => t.id === raw) ? (raw as BoardTab) : DEFAULT_BOARD_TAB;
}

export function boardHref(tab: BoardTab) {
  return `/board?tab=${tab}`;
}
