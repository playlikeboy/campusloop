"use client";

import { Check, Copy } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for every smart block: title, optional source line (so visuals
 * never look more authoritative than their data), and "Copy as Markdown" so the
 * block can travel back into ChatGPT, docs or another article intact.
 */
export function BlockFrame({
  title,
  source,
  raw,
  type,
  actions,
  children,
  className,
}: {
  title?: string;
  source?: string;
  raw: string;
  type: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`\`\`\`${type}\n${raw}\n\`\`\``);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: nothing else to do.
    }
  }

  return (
    <figure className={cn("not-prose my-6 rounded-2xl bg-card/60 p-4 shadow-2xs sm:p-5", className)}>
      <div className="mb-3 flex items-start gap-2">
        {title ? <figcaption className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-foreground">{title}</figcaption> : <span className="flex-1" />}
        {actions}
        <button
          type="button"
          onClick={copy}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          aria-label={copied ? "Copied" : "Copy block as Markdown"}
          title="Copy as Markdown"
        >
          {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
        </button>
      </div>
      {children}
      {source && <p className="mt-3 text-xs text-muted-foreground">Source: {source}</p>}
    </figure>
  );
}

export function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-8 shrink-0 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
        active ? "bg-foreground text-background" : "bg-muted/70 text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
