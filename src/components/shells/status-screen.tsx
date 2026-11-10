import type * as React from "react";
import { cn } from "@/lib/utils";

export interface StatusScreenProps {
  /** Short text on the tilted sticker, e.g. "404" or "Oops". */
  sticker: string;
  title: string;
  /** One plain sentence: what happened and what to do. */
  description: string;
  /** The one action. */
  action: React.ReactNode;
  /** Optional quiet text link under the action. */
  secondary?: React.ReactNode;
  /** Small reference line, e.g. an error digest. */
  footnote?: React.ReactNode;
  className?: string;
}

/** Full-height not-found / error screen: one popped sticker, a heading, one line, one action. */
export function StatusScreen({
  sticker,
  title,
  description,
  action,
  secondary,
  footnote,
  className,
}: StatusScreenProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-[var(--gutter)] py-20 text-center",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="sticker sticker-pop sticker-tilt-l flex h-24 min-w-28 items-center justify-center px-6 [--pop-from:-12deg]"
      >
        <span className="sticker-caption text-5xl text-brand-text">{sticker}</span>
      </div>
      <h1 className="mt-8 text-balance text-3xl text-fg sm:text-4xl">{title}</h1>
      <p className="mt-3 text-pretty text-base text-fg-muted">{description}</p>
      <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto">{action}</div>
      {secondary && <div className="mt-4 text-sm">{secondary}</div>}
      {footnote && <p className="mt-6 font-mono text-xs text-fg-subtle">{footnote}</p>}
    </div>
  );
}
