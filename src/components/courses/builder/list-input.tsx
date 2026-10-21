"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

/** Add/remove short lines (outcomes, requirements, tags). Enter adds. */
export function ListInput({
  label,
  hint,
  items,
  onChange,
  placeholder,
  max,
  chip,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  max: number;
  chip?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || items.length >= max || items.includes(v)) return;
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {items.length > 0 && (
        <ul className={chip ? "mt-2 flex flex-wrap gap-1.5" : "mt-2 space-y-1.5"}>
          {items.map((it, i) => (
            <li key={it} className={chip ? "inline-flex h-8 items-center gap-1 rounded-full bg-muted px-3 text-sm" : "flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm"}>
              <span className={chip ? "" : "flex-1"}>{chip ? `#${it}` : it}</span>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${it}`} className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground cursor-pointer">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length < max && (
        <div className="mt-2 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            className="h-10 min-w-0 flex-1 rounded-xl bg-muted/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button type="button" onClick={add} disabled={!draft.trim()} aria-label={`Add ${label.toLowerCase()}`} className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground disabled:opacity-40 cursor-pointer">
            <Plus className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
