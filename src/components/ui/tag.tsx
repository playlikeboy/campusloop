import React from "react";
import { cn } from "@/lib/utils";

export type TagCategory =
  | "notes"
  | "communities"
  | "events"
  | "housing"
  | "market"
  | "safety"
  | "confessions"
  | "default";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  category?: TagCategory;
  children: React.ReactNode;
}

const CATEGORY_STYLES: Record<TagCategory, string> = {
  notes:
    "bg-[var(--tint-notes)] text-[#1A4B8C] border-[#1A4B8C]/15 dark:bg-[#1A2E4C] dark:text-[#90C2FF] dark:border-[#90C2FF]/20",
  communities:
    "bg-[var(--tint-communities)] text-[#383180] border-[#383180]/15 dark:bg-[#25204D] dark:text-[#C4BCFF] dark:border-[#C4BCFF]/20",
  events:
    "bg-[var(--tint-events)] text-[#8C1D48] border-[#8C1D48]/15 dark:bg-[#4D162C] dark:text-[#FFB3D1] dark:border-[#FFB3D1]/20",
  housing:
    "bg-[var(--tint-housing)] text-[#165B37] border-[#165B37]/15 dark:bg-[#143B26] dark:text-[#9AE6B4] dark:border-[#9AE6B4]/20",
  market:
    "bg-[var(--tint-market)] text-[#7A4B00] border-[#7A4B00]/15 dark:bg-[#47300B] dark:text-[#FBD38D] dark:border-[#FBD38D]/20",
  safety:
    "bg-[var(--tint-safety)] text-[#0F5A60] border-[#0F5A60]/15 dark:bg-[#11383B] dark:text-[#81E6D9] dark:border-[#81E6D9]/20",
  confessions:
    "bg-[#F3E8FF] text-[#6B21A8] border-[#6B21A8]/15 dark:bg-[#2E1065] dark:text-[#D8B4FE] dark:border-[#D8B4FE]/20",
  default:
    "bg-[var(--surface-sunken)] text-[var(--text-secondary)] border-[var(--border)]",
};

export function Tag({
  category = "default",
  className,
  children,
  ...props
}: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border transition-colors shrink-0",
        CATEGORY_STYLES[category],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
