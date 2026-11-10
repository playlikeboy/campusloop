"use client";

import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { POPULAR_CURRICULUM_CODES, TRENDING_TOPICS } from "./search-options";

interface SearchFocusTrayProps {
  recentSearches: string[];
  onSelect: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  onClearRecent: () => void;
  onClose: () => void;
}

export function SearchFocusTray({
  recentSearches,
  onSelect,
  onRemoveRecent,
  onClearRecent,
  onClose,
}: SearchFocusTrayProps) {
  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close suggestions"
        className="fixed inset-0 z-40 cursor-default"
        onClick={onClose}
      />
      <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[60dvh] space-y-4 overflow-y-auto rounded-lg border border-border bg-surface-raised p-4 shadow-lg">
        {recentSearches.length > 0 && (
          <section className="space-y-2" aria-label="Recent searches">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-sm font-semibold text-fg-muted">Recent</h2>
              <Button
                variant="link"
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onClearRecent}
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <Chip
                  key={term}
                  size="sm"
                  icon={<Clock aria-hidden="true" />}
                  onClick={() => onSelect(term)}
                  onRemove={() => onRemoveRecent(term)}
                >
                  {term}
                </Chip>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2" aria-label="Subject codes">
          <h2 className="font-sans text-sm font-semibold text-fg-muted">Subject codes</h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CURRICULUM_CODES.map((item) => (
              <Chip key={item.code} size="sm" onClick={() => onSelect(item.code)} title={item.label}>
                {item.code} · {item.label}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-2" aria-label="Popular searches">
          <h2 className="font-sans text-sm font-semibold text-fg-muted">Popular</h2>
          <div className="flex flex-wrap gap-2">
            {TRENDING_TOPICS.map((topic) => (
              <Chip key={topic} size="sm" onClick={() => onSelect(topic)}>
                {topic}
              </Chip>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
