"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { fieldClassName } from "@/components/ui/input";
import type { Course } from "@/db/schema";
import { cn } from "@/lib/utils";

/** Catalog search. Submits to /courses?q= so results can be shared; suggests titles while typing. */
export function CatalogSearchBar({ initial = "", autoFocus }: { initial?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Pick<Course, "id" | "slug" | "title" | "instructorName">[]>([]);
  const listId = useId();
  const box = useRef<HTMLFormElement>(null);

  useEffect(() => setQ(initial), [initial]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2 || term === initial) return setHits([]);
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/courses?${new URLSearchParams({ q: term, limit: "5" })}`, { signal: ctl.signal })
        .then((r) => (r.ok ? (r.json() as Promise<{ courses: Course[] }>) : { courses: [] }))
        .then((d: { courses: Course[] }) => setHits(d.courses))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q, initial]);

  useEffect(() => {
    const close = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    // biome-ignore lint/a11y/useSemanticElements: <search> is not in the JSX types yet; role="search" is equivalent
    <form
      ref={box}
      action="/courses"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        const term = q.trim();
        router.push(term ? `/courses?${new URLSearchParams({ q: term })}` : "/courses");
      }}
      className="relative w-full"
    >
      <label className="relative block">
        <span className="sr-only">Search courses</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search courses, like Python or DSA"
          className={cn(fieldClassName, "h-12 pl-12 pr-12")}
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </label>
      {open && hits.length > 0 && (
        <ul
          id={listId}
          aria-label="Suggestions"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-border bg-surface-raised py-1 shadow-lg"
        >
          {hits.map((h) => (
            <li key={h.id}>
              <Link
                href={`/courses/${h.slug}`}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center gap-3 px-4 py-2 hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
              >
                <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-fg">{h.title}</span>
                  <span className="block truncate text-xs text-fg-muted">{h.instructorName}</span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <button
              type="submit"
              className="min-h-12 w-full cursor-pointer px-4 py-2 text-left text-sm font-semibold text-brand-text hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
            >
              See all results for "{q.trim()}"
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}
