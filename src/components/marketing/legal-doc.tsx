"use client";

import { ChevronDown, Info } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Building blocks for long read pages (terms, privacy, safety, contact, demo):
 * a sticky table of contents on desktop, a collapsible one on phones, short
 * sections with plain headings, and calm lists and tables.
 */

export interface DocSectionRef {
  id: string;
  label: string;
}

function useActiveSection(sections: DocSectionRef[]) {
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
    for (const el of headings) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  return activeId;
}

/** Sticky table of contents that tracks the section in view. */
export function DocToc({ sections }: { sections: DocSectionRef[] }) {
  const activeId = useActiveSection(sections);

  return (
    <nav aria-label="On this page">
      <p className="px-3 pb-2 text-sm font-semibold text-fg">On this page</p>
      <ul className="space-y-0.5">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "flex min-h-10 items-center rounded-full px-3 text-sm transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-brand-subtle font-semibold text-brand-text"
                    : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                )}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Phone-width table of contents: one tap opens the list of sections. */
function MobileToc({ sections }: { sections: DocSectionRef[] }) {
  return (
    <details className="group mb-8 rounded-lg border border-border bg-surface lg:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
        On this page
        <ChevronDown
          className="size-4 text-fg-muted transition-ui group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ul className="border-t border-border px-2 py-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="flex min-h-11 items-center rounded-full px-3 text-sm text-fg-muted hover:bg-surface-muted hover:text-fg"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function LegalDocHeader({
  title,
  summary,
  meta,
}: {
  title: string;
  summary?: string;
  /** Quiet facts shown in one line, e.g. the update date. */
  meta?: string[];
}) {
  return (
    <header className="pb-8">
      <h1 className="text-balance text-4xl text-fg sm:text-5xl">{title}</h1>
      {summary && <p className="mt-4 max-w-2xl text-pretty text-lg text-fg-muted">{summary}</p>}
      {meta && meta.length > 0 && <p className="mt-3 text-sm text-fg-subtle">{meta.join(" · ")}</p>}
    </header>
  );
}

/** "The short version": three to five plain lines before the full text. */
export function DocSummary({
  title = "The short version",
  items,
}: {
  title?: string;
  items: React.ReactNode[];
}) {
  return (
    <aside aria-label={title} className="mb-10 rounded-lg bg-surface-muted p-5 sm:p-6">
      <h2 className="text-lg text-fg">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-fg marker:text-brand-text">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

export function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 border-t border-border py-8 first-of-type:border-t-0"
    >
      <h2 id={`${id}-title`} className="text-2xl text-fg">
        {title}
      </h2>
      <div className="mt-4 max-w-[68ch] space-y-4 text-base text-fg-muted">{children}</div>
    </section>
  );
}

/** One callout per section at most. */
export function DocNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-surface-muted p-4 text-base text-fg">
      <Info className="mt-0.5 size-5 shrink-0 text-brand-text" aria-hidden="true" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function DocList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-fg-subtle">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** Label / value rows for contact desks, data categories and helplines. */
export function DocTable({ rows }: { rows: { label: string; value: React.ReactNode; note?: string }[] }) {
  return (
    <dl className="divide-y divide-border rounded-lg border border-border bg-surface">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 p-4 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-6">
          <dt className="text-sm font-semibold text-fg">{row.label}</dt>
          <dd className="space-y-1">
            <div className="text-sm text-fg">{row.value}</div>
            {row.note && <p className="text-sm text-fg-muted">{row.note}</p>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Inline email link used across the read pages. */
export function MailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="font-medium break-all text-brand-text underline underline-offset-4 hover:no-underline"
    >
      {email}
    </a>
  );
}

export function DocLayout({
  sections,
  header,
  children,
}: {
  sections: DocSectionRef[];
  /** Page header; the phone table of contents goes right under it. */
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-[var(--gutter)] py-12 sm:py-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <DocToc sections={sections} />
        </div>
      </aside>
      <article className="min-w-0 pb-12">
        {header}
        <MobileToc sections={sections} />
        {children}
      </article>
    </div>
  );
}
