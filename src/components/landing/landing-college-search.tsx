"use client";

import { Loader2, MapPin, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { useColleges } from "@/hooks/use-colleges";
import { cn } from "@/lib/utils";

const MIN_QUERY = 2;
const TEXT_LINK =
  "font-semibold underline underline-offset-4 decoration-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function CollegeResults({ query, onField }: { query: string; onField: boolean }) {
  const { colleges, isLoading, error } = useColleges(5, 1, query);
  const note = cn("mt-3 text-sm", onField ? "text-story-field-fg" : "text-fg-muted");
  const link = cn(TEXT_LINK, onField ? "text-story-field-fg" : "text-brand-text");

  if (error) {
    return (
      <p className={note} role="status">
        Search didn't load.{" "}
        <Link href={`/colleges?q=${encodeURIComponent(query)}`} className={link}>
          Open the college list instead
        </Link>
      </p>
    );
  }

  if (isLoading && colleges.length === 0) {
    return (
      <p className={cn(note, "flex items-center gap-2")} role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Searching for "{query}"
      </p>
    );
  }

  if (colleges.length === 0) {
    return (
      <p className={note} role="status">
        No college called "{query}" yet.{" "}
        <Link href="/college-request" className={link}>
          Request your college
        </Link>
      </p>
    );
  }

  return (
    <>
      <p className="sr-only" role="status">
        {colleges.length} colleges found
      </p>
      <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg bg-sticker text-sticker-fg shadow-sticker">
        {colleges.map((college) => (
          <li key={college.id}>
            <Link
              href={
                college.slug ? `/colleges/${college.slug}` : `/colleges?q=${encodeURIComponent(college.name)}`
              }
              className="flex min-h-12 items-center justify-between gap-4 px-4 py-3 text-left transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="min-w-0 truncate font-semibold">{college.name}</span>
              {(college.district || college.state) && (
                <span className="flex shrink-0 items-center gap-1 text-sm text-fg-subtle">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {[college.district, college.state].filter(Boolean).join(", ")}
                  </span>
                  <span className="sm:hidden">{college.state || college.district}</span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export interface LandingCollegeSearchProps {
  label: string;
  /** Short line under the label, e.g. how many colleges are listed. */
  hint?: string;
  /** `field` = on a violet story field (white text around a white input). */
  tone?: "default" | "field";
}

/** Searches the college directory as you type and links into each college page. */
export function LandingCollegeSearch({ label, hint, tone = "default" }: LandingCollegeSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const onField = tone === "field";

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(value.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    // biome-ignore lint/a11y/useSemanticElements: <search> is not in the JSX types this repo uses
    <form
      role="search"
      className="w-full"
      onSubmit={(event) => {
        event.preventDefault();
        const q = value.trim();
        router.push(q ? `/colleges?q=${encodeURIComponent(q)}` : "/colleges");
      }}
    >
      <label
        htmlFor={inputId}
        className={cn("block text-sm font-semibold", onField ? "text-story-field-fg" : "text-fg")}
      >
        {label}
      </label>
      {hint && (
        <p id={hintId} className={cn("mt-0.5 text-sm", onField ? "text-story-field-muted" : "text-fg-muted")}>
          {hint}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <input
            id={inputId}
            name="q"
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setValue("");
            }}
            placeholder="College name or city"
            aria-describedby={hint ? hintId : undefined}
            autoComplete="off"
            enterKeyHint="search"
            className="h-12 w-full rounded-full border border-border-strong bg-surface pr-11 pl-11 text-base text-fg transition-ui outline-none placeholder:text-fg-subtle focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          variant={onField ? "secondary" : "primary"}
          className="h-12 shrink-0 px-5"
          aria-label="Search colleges"
        >
          <Search className="sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </div>
      {query.length >= MIN_QUERY && <CollegeResults query={query} onField={onField} />}
    </form>
  );
}
