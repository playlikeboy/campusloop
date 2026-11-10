"use client";

import { Check, School, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { type College, useColleges } from "@/hooks/use-colleges";
import { cn } from "@/lib/utils";
import { MAX_DREAM_CAMPUSES } from "./onboarding-options";

interface CampusPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/** Campus Preview: pick up to five colleges you're aiming for. Searches the whole directory. */
export function CampusPicker({ selectedIds, onChange }: CampusPickerProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [details, setDetails] = useState<Record<string, College>>({});

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const { colleges, total, hasMore, isLoading, error, mutate } = useColleges(
    debounced ? 100 : 8,
    1,
    debounced
  );
  const pending = query.trim() !== debounced || isLoading;
  const visible = pending ? [] : debounced ? colleges : colleges.slice(0, 8);
  const selected = useMemo(
    () => selectedIds.map((id) => details[id]).filter((c): c is College => Boolean(c)),
    [selectedIds, details]
  );

  function toggle(college: College) {
    if (selectedIds.includes(college.id)) {
      onChange(selectedIds.filter((id) => id !== college.id));
      return;
    }
    if (selectedIds.length >= MAX_DREAM_CAMPUSES) {
      toast.info(`You can pick up to ${MAX_DREAM_CAMPUSES} colleges. Remove one to add another.`);
      return;
    }
    setDetails((prev) => ({ ...prev, [college.id]: college }));
    onChange([...selectedIds, college.id]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-fg">Colleges you're aiming for</p>
        <span className="text-sm text-fg-subtle tabular-nums">
          {selectedIds.length}/{MAX_DREAM_CAMPUSES}
        </span>
      </div>
      <p className="text-sm text-fg-muted">We'll show you posts from these colleges.</p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((c) => (
            <Chip key={c.id} size="sm" selected onRemove={() => toggle(c)} onSelectedChange={() => toggle(c)}>
              {c.name.split(",")[0]}
            </Chip>
          ))}
        </div>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Enter searches as you type; it must not submit the onboarding form.
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="College name, city or state"
          aria-label="Search colleges"
          autoComplete="off"
          className="pl-10"
        />
      </div>

      <div className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {pending ? (
          <div className="space-y-2 p-3" role="status" aria-label="Searching colleges">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-between gap-3 p-3.5 text-sm text-fg-muted">
            <span>Couldn't load colleges. Check your connection.</span>
            <Button type="button" size="sm" variant="outline" onClick={() => void mutate()}>
              Try again
            </Button>
          </div>
        ) : visible.length > 0 ? (
          visible.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(c)}
                className={cn(
                  "flex min-h-12 w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  isSelected && "bg-brand-subtle"
                )}
              >
                <School className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-fg">{c.name}</span>
                  <span className="block truncate text-xs text-fg-muted">
                    {[c.district, c.state].filter(Boolean).join(", ") || "India"}
                  </span>
                </span>
                {isSelected && <Check className="size-4 shrink-0 text-brand-text" aria-hidden="true" />}
              </button>
            );
          })
        ) : (
          <p className="p-3.5 text-sm text-fg-muted">
            {debounced
              ? "No college matches that. Try the city or a shorter name."
              : "No colleges to show right now."}
          </p>
        )}
      </div>
      {!pending && !error && debounced && hasMore && (
        <p className="text-xs text-fg-muted">
          Showing {colleges.length} of {total.toLocaleString("en-IN")}. Add the city to narrow it down.
        </p>
      )}
    </div>
  );
}
