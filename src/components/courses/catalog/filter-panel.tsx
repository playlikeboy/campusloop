import { Check } from "lucide-react";
import Link from "next/link";
import {
  type CatalogParams,
  catalogHref,
  DURATIONS,
  LANGUAGES,
  LEVELS,
  SOURCES,
} from "@/lib/courses/catalog-params";
import { cn } from "@/lib/utils";

type Option = { label: string; href: string; active: boolean; count?: number };

function Group({ title, options }: { title: string; options: Option[] }) {
  return (
    <fieldset className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <legend className="mb-2 text-sm font-bold text-fg">{title}</legend>
      <ul className="space-y-0.5">
        {options.map((o) => (
          <li key={o.href + o.label}>
            <Link
              href={o.href}
              scroll={false}
              aria-current={o.active ? "true" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-sm px-2 text-sm transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                o.active ? "font-semibold text-fg" : "text-fg-muted"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-sm border",
                  o.active ? "border-brand bg-brand text-brand-fg" : "border-border-strong bg-surface"
                )}
              >
                {o.active && <Check className="size-3.5" aria-hidden />}
              </span>
              <span className="flex-1">{o.label}</span>
              {o.count !== undefined && (
                <span className="text-xs tabular-nums text-fg-subtle">{o.count}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

/** Filter facets as plain links: work without JS, each state has its own URL. Clicking an active option clears it. */
export function FilterPanel({
  params,
  categories,
}: {
  params: CatalogParams;
  categories: { category: string; count: number }[];
}) {
  const toggle = <K extends "level" | "duration" | "source" | "lang">(key: K, value: CatalogParams[K]) => ({
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
      <Group
        title="Level"
        options={(Object.keys(LEVELS) as (keyof typeof LEVELS)[]).map((k) => ({
          label: LEVELS[k],
          ...toggle("level", k),
        }))}
      />
      <Group
        title="Length"
        options={(Object.keys(DURATIONS) as (keyof typeof DURATIONS)[]).map((k) => ({
          label: DURATIONS[k],
          ...toggle("duration", k),
        }))}
      />
      <Group
        title="Language"
        options={(Object.keys(LANGUAGES) as (keyof typeof LANGUAGES)[]).map((k) => ({
          label: LANGUAGES[k],
          ...toggle("lang", k),
        }))}
      />
      <Group
        title="Source"
        options={(Object.keys(SOURCES) as (keyof typeof SOURCES)[]).map((k) => ({
          label: SOURCES[k],
          ...toggle("source", k),
        }))}
      />
    </div>
  );
}
