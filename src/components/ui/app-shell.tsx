"use client";

import type { LucideIcon } from "lucide-react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { EmptyState as SharedEmptyState } from "@/components/ui/empty-state";
import { PageHeader as SharedPageHeader } from "@/components/ui/page-header";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/**
 * CampusLoop app-surface primitives.
 *
 * Every `/app/*` screen is one column of rows under a sticky header — the shape
 * the feed, notifications and profile already use. These components carry that
 * shape so pages stop re-deriving it (and drifting) in their own markup.
 *
 * The scale they encode, taken from the existing feed and sidebar:
 *
 *   Column      max-w-2xl, `border-x border-border/20`
 *   Header      sticky, `bg-background/90 backdrop-blur-xl`, `px-4 py-3.5`
 *   Separator   `divide-y divide-border/30`
 *   Row         `px-4 py-3.5`, `gap-3.5`, `hover:bg-muted/25`
 *   Title       `text-lg font-black tracking-tight`
 *   Body        `text-[15px]`
 *   Meta        `text-[13px] text-muted-foreground`
 *   Micro       `text-[11px] font-bold`
 *   Radius      `rounded-full` for controls, `rounded-xl` for media and inputs
 *   Press       `active:scale-95`
 */

/* ── Column ───────────────────────────────────────────────────────────── */

export function PageShell({
  children,
  className,
  maxWidth = "default",
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "default" | "4xl" | "5xl" | "6xl" | "7xl";
}) {
  const widthClass = {
    default: "max-w-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  }[maxWidth];

  return (
    <main
      className={cn(
        "mx-auto flex min-h-screen w-full flex-col border-x border-border bg-bg pb-28",
        widthClass,
        className
      )}
    >
      {children}
    </main>
  );
}

/* ── Header ───────────────────────────────────────────────────────────── */

/** Sticky column header; wraps the shared PageHeader. `subtitle`/`action` map to its description/primaryAction. */
export function PageHeader({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  /** Right-aligned control, typically a primary action. */
  action?: React.ReactNode;
  /** Tabs or filters pinned beneath the title. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("sticky top-0 z-(--z-sticky) border-b border-border bg-bg/90 backdrop-blur-xl", className)}>
      <SharedPageHeader
        title={title}
        description={subtitle}
        primaryAction={action}
        size="md"
        divider={false}
        className="gap-0 px-4 pt-3.5 pb-0 [&>div:first-child]:pb-3.5"
      >
        {children}
      </SharedPageHeader>
    </header>
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */

export interface PageTab<T extends string> {
  id: T;
  label: string;
}

/** Equal-width tabs with the feed's underline indicator. */
export function PageTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: PageTab<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center", className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              haptics.light();
              onChange(tab.id);
            }}
            className={cn(
              "relative flex-1 cursor-pointer py-3 text-[13px] font-semibold transition-colors",
              isActive
                ? "font-bold text-foreground"
                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            )}
          >
            <span className="truncate px-1">{tab.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Filter pills ─────────────────────────────────────────────────────── */

export interface FilterPill<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

/** Horizontally scrolling filter strip. Active state is inverted, as in the feed. */
export function FilterPills<T extends string>({
  pills,
  value,
  onChange,
  className,
  bordered = true,
}: {
  pills: FilterPill<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  /** Draws the section separator; turn off when stacking several strips. */
  bordered?: boolean;
}) {
  return (
    <div className={cn(bordered && "border-b border-border/30", "px-4 py-3", className)}>
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
        {pills.map((pill) => {
          const Icon = pill.icon;
          const isActive = value === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                haptics.light();
                onChange(pill.id);
              }}
              className={cn(
                "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors outline-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                isActive
                  ? "bg-brand-subtle text-brand-text"
                  : "bg-surface-muted text-fg-muted hover:bg-surface-sunken hover:text-fg"
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Search ───────────────────────────────────────────────────────────── */

export function SearchField({
  value,
  onChange,
  placeholder = "Search",
  className,
  bordered = true,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div className={cn(bordered && "border-b border-border/30", "px-4 py-3", className)}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-sm border border-border bg-surface pl-10 pr-10 text-base text-fg outline-none transition-colors placeholder:text-fg-subtle focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-fg-muted outline-none transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── List ─────────────────────────────────────────────────────────────── */

export function PageList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-border/30", className)}>{children}</div>;
}

/** One tappable row. Renders as a link when `href` is given. */
export function ListRow({
  href,
  onClick,
  children,
  className,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const classes = cn(
    "group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-primary/[0.035]",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(classes, "cursor-pointer")}>
      {children}
    </button>
  );
}

/* ── States ───────────────────────────────────────────────────────────── */

/** Column empty state; the shared EmptyState in compact form. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return <SharedEmptyState icon={icon} title={title} description={description} action={action} size="compact" />;
}

/**
 * Row-shaped loading placeholder. Matching the real row's geometry stops the
 * layout jumping when data lands.
 */
export function RowSkeleton({
  count = 5,
  media = "avatar",
}: {
  count?: number;
  /** `avatar` is a circle, `thumb` a rounded square, `none` text only. */
  media?: "avatar" | "thumb" | "none";
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3.5 px-4 py-3.5">
          {media !== "none" && (
            <div
              className={cn(
                "size-11 shrink-0 bg-muted/60",
                media === "avatar" ? "rounded-full" : "rounded-xl"
              )}
            />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 rounded bg-muted/60" />
            <div className="h-2.5 w-1/3 rounded bg-muted/40" />
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Primary action ───────────────────────────────────────────────────── */

/** Pill CTA used in headers and empty states. */
export function PrimaryAction({
  href,
  onClick,
  icon: Icon,
  children,
  compactLabel,
  className,
  disabled,
}: {
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
  /** Shown instead of `children` below the `sm` breakpoint. */
  compactLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const classes = cn(
    "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-brand px-4 text-xs font-semibold text-brand-fg transition-colors outline-none hover:bg-brand-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    className
  );

  const inner = (
    <>
      {Icon && <Icon className="size-3.5" />}
      {compactLabel ? (
        <>
          <span className="hidden sm:inline">{children}</span>
          <span className="sm:hidden">{compactLabel}</span>
        </>
      ) : (
        <span>{children}</span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={() => haptics.light()} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {inner}
    </button>
  );
}
