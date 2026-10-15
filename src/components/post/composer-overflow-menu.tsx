"use client";

import { Loader2, MoreHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";

export interface ComposerAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/** Secondary composer tools (voice, docs, stickers, formatting, story) behind one button. */
export function ComposerOverflowMenu({
  actions,
  onAddStory,
}: {
  actions: ComposerAction[];
  onAddStory: () => void;
}) {
  const [open, setOpen] = useState(false);

  const items: ComposerAction[] = [
    ...actions,
    { id: "story", label: "Share as story", icon: Sparkles, onClick: onAddStory },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="More tools"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <MoreHorizontal className="size-5" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute bottom-11 left-0 z-40 w-56 rounded-2xl border border-border/60 bg-popover p-1.5 shadow-xl"
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                {item.loading ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <item.icon className="size-4 shrink-0 text-primary" />
                )}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
