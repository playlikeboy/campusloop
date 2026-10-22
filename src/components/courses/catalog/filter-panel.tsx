import { Check } from "lucide-react";
import Link from "next/link";
import { type CatalogParams, catalogHref, DURATIONS, LEVELS, SOURCES } from "@/lib/courses/catalog-params";
import { cn } from "@/lib/utils";

type Option = { label: string; href: string; active: boolean; count?: number };

function Group({ title, options }: { title: string; options: Option[] }) {
  return (
    <fieldset className="border-t border-border/50 py-4 first:border-t-0 first:pt-0">
      <legend className="mb-2 text-sm font-bold text-foreground">{title}</legend>
      <ul className="space-y-0.5">
        {options.map((o) => (
          <li key={o.href + o.label}>
            <Link
              href={o.href}
              scroll={false}
              aria-current={o.active ? "true" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-2.5 rounded-xl px-2 text-sm transition-colors hover:bg-muted/60",
                o.active ? "font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md ring-1", o.active ? "bg-primary text-primary-foreground ring-primary" : "ring-border")}>
                {o.active && <Check className="size-3.5" aria-hidden />}
              </span>
              <span className="flex-1">{o.label}</span>
              {o.count !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{o.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

/** Filter facets as plain links: work without JS, each state has its own URL. Clicking an active option clears it. */
export function FilterPanel({ params, categories }: { params: CatalogParams; categories: { category: string; count: number }[] }) {
  const toggle = <K extends "level" | "duration" | "source">(key: K, value: CatalogParams[K]) => ({
    href: catalogHref(params, { [key]: params[key] === value ? null : value }),
    active: params[key] === value,
  });
  return (
    <div>
      <Group
        title="Topic"
        options={categories.map((c) => ({
          label: c.category,
          count: c.count,
          href: catalogHref(params, { category: params.category === c.category ? null : c.category }),
          active: params.category === c.category,
        }))}
      />
      <Group title="Level" options={(Object.keys(LEVELS) as (keyof typeof LEVELS)[]).map((k) => ({ label: LEVELS[k], ...toggle("level", k) }))} />
      <Group title="Video duration" options={(Object.keys(DURATIONS) as (keyof typeof DURATIONS)[]).map((k) => ({ label: DURATIONS[k], ...toggle("duration", k) }))} />
      <Group title="Source" options={(Object.keys(SOURCES) as (keyof typeof SOURCES)[]).map((k) => ({ label: SOURCES[k], ...toggle("source", k) }))} />
    </div>
  );
}
