"use client";

import { useEffect, useState } from "react";
import { Check, ShieldAlert } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface DocSectionRef {
  id: string;
  label: string;
}

/** Sticky table of contents that tracks the section currently in view. */
export function DocToc({ sections }: { sections: DocSectionRef[] }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const headings = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="space-y-1.5 p-3 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs">
      <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-[#22c55e]" />
        <span>Document Index</span>
      </p>
      {sections.map((section, idx) => {
        const isActive = activeId === section.id;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              isActive
                ? "bg-primary/10 text-primary border border-primary/20 shadow-xs"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <span className="font-mono text-[10px] text-muted-foreground/60">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="truncate">{section.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export function LegalDocHeader({
  eyebrow,
  title,
  summary,
  meta,
}: {
  eyebrow?: string;
  title: string;
  summary?: string;
  meta?: string[];
}) {
  return (
    <header className="pb-8">
      {eyebrow && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-4 shadow-2xs">
          <span className="size-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span>{eyebrow}</span>
        </div>
      )}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-foreground">
        {title}
      </h1>
      {summary && (
        <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
          {summary}
        </p>
      )}
      {meta && meta.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {meta.map((m) => (
            <span
              key={m}
              className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-2xs"
            >
              {m}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}

export function DocSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32 rounded-3xl border border-border/70 bg-card/75 backdrop-blur-sm p-6 sm:p-8 shadow-xs space-y-4 mb-6 transition-all hover:border-primary/30"
    >
      <div className="flex items-center gap-3 border-b border-border/40 pb-3">
        {number !== undefined && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-mono text-xs font-black">
            {String(number).padStart(2, "0")}
          </span>
        )}
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

/** Cute voxel aside callout card with green/amber highlights. */
export function DocNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-emerald-500/25 bg-emerald-500/5 p-4 sm:p-5 flex items-start gap-3 text-xs sm:text-sm text-foreground shadow-2xs leading-relaxed">
      <ShieldAlert className="size-4.5 text-[#16a34a] shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function DocList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <div className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Check className="size-2.5 stroke-[3]" />
          </div>
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Voxel label/value rows for contact desks, data categories, and helplines. */
export function DocTable({
  rows,
}: {
  rows: { label: string; value: React.ReactNode; note?: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/60 shadow-2xs divide-y divide-border/40">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid gap-1.5 p-4 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6 hover:bg-muted/20 transition-colors"
        >
          <dt className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-primary" />
            <span>{row.label}</span>
          </dt>
          <dd className="space-y-1">
            <div className="text-xs sm:text-sm font-semibold text-foreground">{row.value}</div>
            {row.note && (
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-normal">
                {row.note}
              </p>
            )}
          </dd>
        </div>
      ))}
    </div>
  );
}

export function DocLayout({
  sections,
  children,
}: {
  sections: DocSectionRef[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-32">
          <DocToc sections={sections} />
        </div>
      </aside>

      <article className="min-w-0 pb-20">{children}</article>
    </div>
  );
}
