"use client";

import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HubLayoutProps {
  /** Names the panel for screen readers; the page heading is "Campus board". */
  title: string;
  /** One short line about this tab. */
  description: string;
  /** The tab's one create action. */
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}

/** Shared frame for the Campus board tabs: Rides, Housing, Lost and found, Buy and sell. */
export function HubLayout({ title, description, action, children, className }: HubLayoutProps) {
  return (
    <section aria-label={title} className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-pretty text-sm text-fg-muted">{description}</p>
        {action && (
          <Button asChild size="sm" className="shrink-0">
            <Link href={action.href}>
              <Plus className="size-4" aria-hidden="true" />
              {action.label}
            </Link>
          </Button>
        )}
      </div>
      {children}
    </section>
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
          className="absolute top-1/2 right-0 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
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
