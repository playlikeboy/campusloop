"use client";

import { Loader2, MoreHorizontal, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const items: ComposerAction[] = [
    ...actions,
    { id: "story", label: "Share as story", icon: Sparkles, onClick: onAddStory },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More tools"
        className="flex size-11 items-center justify-center rounded-full text-brand-text transition-ui hover:bg-brand-subtle cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        {items.map((item) => (
          <DropdownMenuItem key={item.id} disabled={item.disabled} onClick={item.onClick}>
            {item.loading ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-fg-muted" aria-hidden />
            ) : (
              <item.icon className="size-4 shrink-0 text-fg-muted" aria-hidden />
            )}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
