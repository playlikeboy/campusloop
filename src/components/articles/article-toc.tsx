"use client";

import { ChevronDown, ListTree } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { extractHeadings } from "@/lib/articles/headings";
import { cn } from "@/lib/utils";

/** Collapsible "In this article" list built from the article's headings; highlights the current section. */
export function ArticleToc({ content }: { content: string }) {
  const headings = useMemo(() => extractHeadings(content).filter((h) => h.level <= 2), [content]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length < 3) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav aria-label="In this article" className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ListTree className="size-4 text-fg-subtle" aria-hidden />
        In this article
        <span className="text-xs font-normal text-fg-muted tabular-nums">{headings.length} sections</span>
        <ChevronDown
          className={cn("ml-auto size-4 text-fg-subtle transition-ui", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <ol className="space-y-0.5 px-2 pb-3">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={active === h.id ? "location" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-10 items-center rounded-sm px-2 text-sm transition-ui hover:bg-surface-muted",
                  h.level === 2 && "pl-5",
                  active === h.id ? "font-semibold text-brand-text" : "text-fg-muted hover:text-fg"
                )}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
