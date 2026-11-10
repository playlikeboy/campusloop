import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Button } from "@/components/ui/button";

/** Header for the host's event tools: back to the event hub, page name, event name. */
export function ManageHeader({
  slug,
  title,
  eventTitle,
  action,
}: {
  slug: string;
  title: string;
  eventTitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start gap-2">
      <Button asChild variant="ghost" size="icon" aria-label="Back to event">
        <Link href={`/events/manage/${slug}`}>
          <ArrowLeft aria-hidden="true" />
        </Link>
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-fg">{title}</h1>
        {eventTitle && <p className="truncate text-sm text-fg-muted">{eventTitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}
