import { ArrowLeft, BookOpen, CalendarDays, Plus, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

type WorkspaceSection = "academics" | "events";

interface WorkspaceHeaderProps {
  section: WorkspaceSection;
  authenticated?: boolean;
}

const config: Record<
  WorkspaceSection,
  {
    href: string;
    title: string;
    subtitle: string;
    icon: typeof CalendarDays;
    actionHref: string;
    actionLabel: string;
  }
> = {
  events: {
    href: "/events",
    title: "Events",
    subtitle: "Hackathons, fests & campus meetups",
    icon: CalendarDays,
    actionHref: "/events/new",
    actionLabel: "Host",
  },
  academics: {
    href: "/academics",
    title: "Academics",
    subtitle: "Notes, PYQs & study resources",
    icon: BookOpen,
    actionHref: "/academics/upload",
    actionLabel: "Upload",
  },
};

export function WorkspaceHeader({
  section,
  authenticated = false,
}: WorkspaceHeaderProps): ReactNode {
  const item = config[section];
  const Icon = item.icon;

  return (
    <header
      data-workspace-header={section}
      className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex min-h-12 w-full max-w-7xl items-center gap-2 px-3 sm:min-h-14 sm:px-5">
        <Link
          href="/feeds"
          aria-label="Back to CampusLoop"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>

        <Link
          href={item.href}
          className="min-w-0 flex-1 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
              {item.title}
            </span>
          </div>
          <span className="ml-10 hidden truncate text-[11px] font-medium text-muted-foreground sm:block">
            {item.subtitle}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          {section === "academics" && (
            <Link
              href="/academics/search"
              aria-label="Search academic resources"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="size-4" aria-hidden="true" />
            </Link>
          )}

          {authenticated && (
            <Link
              href={item.actionHref}
              className={cn(
                "flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground transition-transform hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "sm:min-h-10 sm:px-3.5 sm:text-sm"
              )}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{item.actionLabel}</span>
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
