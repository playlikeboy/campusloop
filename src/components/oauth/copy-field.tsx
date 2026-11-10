"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Read-only value with a copy button (client IDs, secrets, snippets). */
export function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <p className="text-xs font-semibold text-fg-muted">{label}</p>
      <div className="mt-1 flex items-center gap-2 rounded-md bg-surface-muted py-1 pl-3 pr-1">
        <code
          className={
            secret
              ? "min-w-0 flex-1 break-all font-mono text-sm text-fg"
              : "min-w-0 flex-1 truncate font-mono text-sm text-fg"
          }
        >
          {value}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value).then(() => {
              setDone(true);
              setTimeout(() => setDone(false), 1500);
            });
          }}
          aria-label={`Copy ${label}`}
          className="flex size-10 shrink-0 items-center justify-center cursor-pointer rounded-full text-fg-muted transition-ui hover:bg-surface hover:text-fg"
        >
          {done ? <Check className="size-4 text-verified-text" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
