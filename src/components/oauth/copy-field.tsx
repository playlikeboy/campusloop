"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Read-only value with a copy button (client IDs, secrets, snippets). */
export function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2 rounded-xl bg-muted/50 py-1 pl-3 pr-1">
        <code className={secret ? "min-w-0 flex-1 break-all font-mono text-[13px] text-foreground" : "min-w-0 flex-1 truncate font-mono text-[13px] text-foreground"}>{value}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value).then(() => {
              setDone(true);
              setTimeout(() => setDone(false), 1500);
            });
          }}
          aria-label={`Copy ${label}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground cursor-pointer"
        >
          {done ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
