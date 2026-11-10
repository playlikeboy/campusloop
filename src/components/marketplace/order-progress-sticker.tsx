import { Sticker } from "@/components/ui/stickers/sticker";
import { StoryProgress } from "@/components/ui/stickers/story-progress";
import type { TimelineStep } from "./status-timeline";

interface OrderProgressStickerProps {
  steps: TimelineStep[];
  current: string;
  /** Overrides the step label as the caption, e.g. the status badge wording. */
  label?: string;
}

/** Brand status caption with a segmented step bar. Shows the real order or booking step. */
export function OrderProgressSticker({ steps, current, label }: OrderProgressStickerProps) {
  const index = steps.findIndex((s) => s.key === current);
  if (index < 0) return null;
  const step = steps[index];
  const isLast = index === steps.length - 1;
  return (
    <Sticker tone="brand" className="space-y-3 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="sticker-caption min-w-0 text-xl break-words">{label ?? step.label}</p>
        <p className="shrink-0 text-xs font-medium tabular-nums opacity-80">
          Step {index + 1} of {steps.length}
        </p>
      </div>
      <StoryProgress
        tone="onField"
        count={steps.length}
        current={isLast ? steps.length : index}
        progress={0.5}
        aria-label={`Step ${index + 1} of ${steps.length}: ${step.label}`}
      />
      <p className="text-sm opacity-90">{step.desc}</p>
    </Sticker>
  );
}
