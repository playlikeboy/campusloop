"use client";

import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { ContextualLivingNav } from "@/components/navigation/contextual-living-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HubLayoutProps {
  title: string;
  /** One short line under the title. */
  description: string;
  /**
   * The hub's one create action. Shown here on phones only; from `sm` up the
   * living sub-nav already shows the same button.
   */
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}

/** Shared frame for Buy and sell, Housing, Lost and found and Ride share. */
export function HubLayout({ title, description, action, children, className }: HubLayoutProps) {
  return (
    <div className="min-h-screen pb-24">
      <ContextualLivingNav />
      <main className={cn("mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6", className)}>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="text-balance text-3xl text-fg">{title}</h1>
            <p className="max-w-xl text-pretty text-sm text-fg-muted">{description}</p>
          </div>
          {action && (
            <Button asChild size="sm" className="shrink-0 sm:hidden">
              <Link href={action.href}>
                <Plus className="size-4" aria-hidden="true" />
                {action.label}
              </Link>
            </Button>
          )}
        </header>
        {children}
      </main>
    </div>
  );
}

interface HubSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}

/** Search field with a leading icon and a clear button. */
export function HubSearch({ value, onChange, placeholder, label, className }: HubSearchProps) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/** Horizontal scroll row of filter chips. */
export function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="no-scrollbar -mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  );
}
