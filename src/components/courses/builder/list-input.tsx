"use client";

import { Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";

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
  const id = useId();
  const add = () => {
    const v = draft.trim();
    if (!v || items.length >= max || items.includes(v)) return;
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-fg">
        {label}
      </label>
      {hint && <p className="text-xs text-fg-muted">{hint}</p>}
      {items.length > 0 && (
        <ul className={chip ? "mt-2 flex flex-wrap gap-1.5" : "mt-2 space-y-1.5"}>
          {items.map((it, i) => (
            <li
              key={it}
              className={
                chip
                  ? "inline-flex h-11 items-center gap-0.5 rounded-full bg-surface-muted pl-3.5 text-sm text-fg"
                  : "flex items-center gap-2 rounded-md bg-surface-muted pl-3 text-sm text-fg"
              }
            >
              <span className={chip ? "" : "flex-1"}>{chip ? `#${it}` : it}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={`Remove ${it}`}
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length < max && (
        <div className="mt-2 flex gap-2">
          <Input
            id={id}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            className="flex-1"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            aria-label={`Add ${label.toLowerCase()}`}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-muted text-fg transition-ui hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
