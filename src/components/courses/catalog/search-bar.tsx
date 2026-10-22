"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Course } from "@/db/schema";

/** Catalog search. Submits to /courses?q= so results are linkable; suggests titles while typing. */
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
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
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
          aria-controls={listId}
          aria-expanded={open && hits.length > 0}
          role="combobox"
          placeholder="Search Python, web development, SQL, AI..."
          className="h-12 w-full rounded-2xl bg-card/80 pl-12 pr-11 text-[15px] text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted cursor-pointer">
            <X className="size-4" />
          </button>
        )}
      </label>
      {open && hits.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-popover py-1 shadow-lg ring-1 ring-border/50">
          {hits.map((h) => (
            <li key={h.id} role="option" aria-selected={false}>
              <Link href={`/courses/${h.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{h.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{h.instructorName}</span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <button type="submit" className="w-full px-4 py-2.5 text-left text-sm font-semibold text-primary hover:bg-muted/60 cursor-pointer">
              See all results for "{q.trim()}"
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}
