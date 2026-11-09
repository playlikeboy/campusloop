"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { useColleges } from "@/hooks/use-colleges";
import { Button } from "@/components/ui/button";
import "./landing.css";

const MIN_QUERY = 2;

function CollegeResults({ query }: { query: string }) {
  const { colleges, isLoading, error } = useColleges(5, 1, query);

  if (error) {
    return (
      <p className="mt-3 text-sm text-fg-muted" role="status">
        Search is taking a break.{" "}
        <Link href={`/colleges?q=${encodeURIComponent(query)}`} className="font-semibold text-brand-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Browse the directory instead
        </Link>
      </p>
    );
  }

  if (isLoading && colleges.length === 0) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-fg-muted" role="status">
        <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Looking for “{query}”…
      </p>
    );
  }

  if (colleges.length === 0) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted" role="status">
        <span>No hub for “{query}” yet.</span>
        <Link href="/college-request" className="font-semibold text-brand-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Request your college
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="sr-only" role="status">{colleges.length} colleges found</p>
      <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg bg-surface shadow-sm">
        {colleges.map((college) => (
          <li key={college.id}>
            <Link
              href={college.slug ? `/colleges/${college.slug}` : `/colleges?q=${encodeURIComponent(college.name)}`}
              className="flex min-h-[52px] items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <span className="min-w-0 truncate font-semibold text-fg">{college.name}</span>
              {(college.district || college.state) && (
                <span className="flex shrink-0 items-center gap-1 text-sm text-fg-subtle">
                  <MapPin size={14} aria-hidden="true" />
                  {[college.district, college.state].filter(Boolean).join(", ")}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/** The one working control on the page: searches the college directory and links into each hub. */
export function LandingCollegeSearch({ label }: { label: string }) {
  const router = useRouter();
  const inputId = useId();
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(value.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [value]);

  const showResults = query.length >= MIN_QUERY;

  return (
    <form
      role="search"
      className="landing-search w-full"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(value.trim() ? `/colleges?q=${encodeURIComponent(value.trim())}` : "/colleges");
      }}
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-fg">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <input
            id={inputId}
            name="q"
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") setValue(""); }}
            placeholder="Try “BIT Mesra” or “Pune”"
            autoComplete="off"
            enterKeyHint="search"
            className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-11 text-base text-fg placeholder:text-fg-subtle focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        <Button type="submit" variant="secondary" size="lg" className="shrink-0">
          Find your college
        </Button>
      </div>
      {showResults && <CollegeResults query={query} />}
    </form>
  );
}
