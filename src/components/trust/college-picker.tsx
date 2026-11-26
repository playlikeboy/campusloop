"use client";

import { School, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { type College, useColleges } from "@/hooks/use-colleges";

export interface PickedCollege {
  id: string;
  name: string;
}

interface CollegePickerProps {
  value: PickedCollege | null;
  onChange: (college: PickedCollege | null) => void;
  label?: string;
  hint?: string;
}

/**
 * Pick one college from the directory. Same search and list style as the
 * Campus Preview picker in onboarding, single-select.
 */
export function CollegePicker({
  value,
  onChange,
  label = "Your college",
  hint = "Search by name, city or state.",
}: CollegePickerProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const { colleges, total, hasMore, isLoading, error, mutate } = useColleges(debounced ? 50 : 8, 1, debounced);
  const pending = query.trim() !== debounced || isLoading;
  const visible: College[] = pending ? [] : debounced ? colleges : colleges.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-fg">{label}</p>
        {hint && <p className="text-sm text-fg-muted">{hint}</p>}
      </div>

      {value && (
        <div className="flex items-center gap-3 rounded-lg bg-brand-subtle px-3.5 py-2.5">
          <School className="size-4 shrink-0 text-brand-text" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{value.name}</span>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
            Change
          </Button>
        </div>
      )}

      {!value && (
        <>
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
                // Enter searches as you type; it must not submit a surrounding form.
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="College name, city or state"
              aria-label="Search colleges"
              autoComplete="off"
              className="pl-10"
            />
          </div>

          <div className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border">
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
              visible.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange({ id: c.id, name: c.name })}
                  className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <School className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">{c.name}</span>
                    <span className="block truncate text-xs text-fg-muted">
                      {[c.district, c.state].filter(Boolean).join(", ") || "India"}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="p-3.5 text-sm text-fg-muted">
                {debounced ? "No college matches that. Try the city or a shorter name." : "No colleges to show right now."}
              </p>
            )}
          </div>
          {!pending && !error && debounced && hasMore && (
            <p className="text-xs text-fg-muted">
              Showing {colleges.length} of {total.toLocaleString("en-IN")}. Add the city to narrow it down.
            </p>
          )}
        </>
      )}
    </div>
  );
}
