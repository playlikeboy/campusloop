"use client";

import { Sparkles, VenetianMask } from "lucide-react";
import { CuteCatEmpty } from "@/components/ui/cute-illustrations";
import { Button } from "@/components/ui/button";
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
      <div className="flex justify-center mb-2">
        <CuteCatEmpty size={104} />
      </div>

      <div className="space-y-1.5">
        <h3 className="font-heading text-base font-bold tracking-tight text-foreground">
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

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <Button
          onClick={() => {
            sounds.pop();
            haptics.medium();
            onOpenComposer?.();
          }}
          size="default"
          className="w-full sm:w-auto"
        >
          <VenetianMask className="size-4" />
          <span>Spill First Confession</span>
        </Button>

        {activeTag && onResetFilter && (
          <Button
            variant="outline"
            onClick={() => {
              sounds.tap();
              onResetFilter();
            }}
            size="default"
            className="w-full sm:w-auto"
          >
            Show All Whispers
          </Button>
        )}
      </div>
    </div>
  );
}
