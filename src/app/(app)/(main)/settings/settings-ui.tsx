"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

/** Reads and writes one browser preference. Storage can be blocked, so every access is guarded. */
export function useLocalPref<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key) as T | null;
      if (saved !== null && allowed.includes(saved)) setValue(saved);
    } catch {
      // Private mode or blocked storage: keep the default.
    }
    // allowed is a constant list per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  function update(next: T) {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // Not saved for next visit, but the choice still applies now.
    }
  }
  return [value, update] as const;
}

export function SettingsSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h2 id={id} className="px-1 text-lg text-fg">
        {title}
      </h2>
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">{children}</div>
    </section>
  );
}

export function SettingsRow({
  label,
  description,
  children,
  stack,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
  /** Put the control under the text (for wide controls on phones). */
  stack?: boolean;
}) {
  return (
    <div className={stack ? "space-y-3 p-4" : "flex items-center justify-between gap-4 p-4"}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-fg">{label}</p>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {children && <div className={stack ? "" : "shrink-0"}>{children}</div>}
    </div>
  );
}

export function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 p-4">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-fg">{label}</span>
        {description && <span className="block text-sm text-fg-muted">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
    </label>
  );
}

export function SettingsLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between gap-4 p-4 transition-ui hover:bg-surface-muted"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-fg">{label}</span>
        {description && <span className="block text-sm text-fg-muted">{description}</span>}
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />
    </Link>
  );
}
