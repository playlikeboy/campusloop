"use client";

import { Flag, Lock } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

interface ConfessionSidebarProps {
  scope: "CAMPUS" | "GLOBAL";
  onScopeChange: (scope: "CAMPUS" | "GLOBAL") => void;
  campusName: string;
  activeTag?: string | null;
  onTagSelect?: (tag: string) => void;
  className?: string;
}

const TOPIC_TAGS = [
  "#HostelLore",
  "#PlacementTea",
  "#CampusCrush",
  "#ExamVent",
  "#ProfTales",
  "#LateNightThoughts",
  "#MessFood",
];

/** Desktop rail: how anonymity works, where you're reading from, topics and house rules. Calm, no stickers. */
export function ConfessionSidebar({
  scope,
  onScopeChange,
  campusName,
  activeTag,
  onTagSelect,
  className,
}: ConfessionSidebarProps) {
  return (
    <aside className={cn("flex flex-col gap-4", className)}>
      <section
        className="rounded-lg border border-border bg-surface p-4"
        aria-labelledby="confession-anon-title"
      >
        <h2 id="confession-anon-title" className="flex items-center gap-2 text-base">
          <Lock className="size-4 text-fg-muted" aria-hidden />
          You stay anonymous
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          Confessions show a random nickname, never your name, photo or profile. Only students who signed in
          can post.
        </p>
      </section>

      <section
        className="rounded-lg border border-border bg-surface p-4"
        aria-labelledby="confession-scope-title"
      >
        <h2 id="confession-scope-title" className="text-base">
          Show confessions from
        </h2>
        <SegmentedControl
          className="mt-3"
          size="sm"
          fullWidth
          value={scope}
          onChange={onScopeChange}
          options={[
            { value: "GLOBAL", label: "All colleges" },
            { value: "CAMPUS", label: campusName },
          ]}
        />
      </section>

      <section
        className="rounded-lg border border-border bg-surface p-4"
        aria-labelledby="confession-topics-title"
      >
        <h2 id="confession-topics-title" className="text-base">
          Topics
        </h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TOPIC_TAGS.map((tag) => {
            const selected = activeTag === tag;
            return (
              <Chip
                key={tag}
                size="sm"
                selected={selected}
                onClick={() => onTagSelect?.(selected ? "" : tag)}
              >
                {tag}
              </Chip>
            );
          })}
        </div>
      </section>

      <section
        className="rounded-lg border border-border bg-surface p-4"
        aria-labelledby="confession-rules-title"
      >
        <h2 id="confession-rules-title" className="flex items-center gap-2 text-base">
          <Flag className="size-4 text-fg-muted" aria-hidden />
          House rules
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">
          <li>Don&apos;t name, target or expose anyone.</li>
          <li>No phone numbers, room numbers or handles.</li>
          <li>See something harmful? Report it from the post menu.</li>
        </ul>
      </section>
    </aside>
  );
}
