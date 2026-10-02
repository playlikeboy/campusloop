"use client";

import { Sparkles, VenetianMask } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface ConfessionEmptyStateProps {
  scope: "CAMPUS" | "GLOBAL";
  campusName: string;
  activeTag?: string | null;
  onOpenComposer?: () => void;
  onResetFilter?: () => void;
}

export function ConfessionEmptyState({
  scope,
  campusName,
  activeTag,
  onOpenComposer,
  onResetFilter,
}: ConfessionEmptyStateProps) {
  return (
    <div className="py-16 sm:py-20 text-center px-4 space-y-4 max-w-sm mx-auto select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="relative flex size-16 items-center justify-center rounded-3xl bg-purple-500/15 text-purple-400 border border-purple-500/30 mx-auto shadow-lg shadow-purple-950/20">
        <VenetianMask className="size-8" />
        <div className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
          <Sparkles className="size-2.5" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-black tracking-tight text-foreground">
          {activeTag
            ? `No whispers in ${activeTag} yet`
            : scope === "CAMPUS"
              ? `Silence in ${campusName}`
              : "No confessions found here yet"}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {activeTag
            ? `Be the first student to drop a secret under ${activeTag}. It's 100% anonymous.`
            : scope === "CAMPUS"
              ? "Your college hub is waiting for its first secret drop. Spill the tea safely."
              : "Spill the untold hostel lore, exam panic, or late-night thoughts completely sealed."}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            sounds.pop();
            haptics.medium();
            onOpenComposer?.();
          }}
          className="w-full sm:w-auto h-10 px-5 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-black shadow-sm shadow-primary/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <VenetianMask className="size-4" />
          <span>Spill First Confession</span>
        </button>

        {activeTag && onResetFilter && (
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              onResetFilter();
            }}
            className="w-full sm:w-auto h-10 px-4 rounded-full border border-border/50 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Show All Whispers
          </button>
        )}
      </div>
    </div>
  );
}
