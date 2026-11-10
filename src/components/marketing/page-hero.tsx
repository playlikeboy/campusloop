import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Violet story-field hero for persuade pages (about, pitch, aspirants).
 * Headline + one line + actions on the left, one sticker moment on the right.
 */
export function StoryHero({
  title,
  lede,
  actions,
  aside,
  footnote,
}: {
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  /** One sticker (or sticker cluster). Hidden from nothing: it stacks under the text on phones. */
  aside?: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <section className="story-field overflow-hidden">
      <div className="mx-auto grid max-w-[var(--container-marketing)] items-center gap-10 px-[var(--gutter)] py-14 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
        <div className="max-w-2xl">
          <h1 className="text-balance text-4xl text-story-field-fg sm:text-5xl lg:text-6xl">{title}</h1>
          {lede && <p className="mt-5 max-w-xl text-pretty text-lg text-story-field-muted">{lede}</p>}
          {actions && <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>}
          {footnote && <p className="mt-6 text-sm text-story-field-muted">{footnote}</p>}
        </div>
        {aside && <div className="flex justify-center lg:justify-end">{aside}</div>}
      </div>
    </section>
  );
}

/** Calm page intro for read pages (help, guide, legal, investors). */
export function PageIntro({
  title,
  lede,
  meta,
  children,
  className,
}: {
  title: React.ReactNode;
  lede?: React.ReactNode;
  /** Small quiet line, e.g. "Updated 2 November 2026". */
  meta?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("max-w-3xl", className)}>
      <h1 className="text-balance text-4xl text-fg sm:text-5xl">{title}</h1>
      {lede && <p className="mt-4 max-w-2xl text-pretty text-lg text-fg-muted">{lede}</p>}
      {meta && <p className="mt-3 text-sm text-fg-subtle">{meta}</p>}
      {children && <div className="mt-6">{children}</div>}
    </header>
  );
}

/** Narrow centred column for read pages. */
export function ReadColumn({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl px-[var(--gutter)] py-12 sm:py-16", className)}>
      {children}
    </div>
  );
}
