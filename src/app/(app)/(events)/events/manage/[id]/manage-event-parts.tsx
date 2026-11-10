"use client";

import { BarChart3, ChevronRight, Megaphone, QrCode, Settings, Users } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { formatTimeAgo, initialOf } from "@/lib/utils";

const REG_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  ATTENDED: { label: "Checked in", variant: "verified" },
  CONFIRMED: { label: "Going", variant: "neutral" },
  WAITLISTED: { label: "Waitlist", variant: "warning" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

export interface ManageRegistration {
  id: string;
  teamName: string | null;
  status: string;
  createdAt: string;
  profile?: { displayName: string; username: string; avatarUrl: string | null } | null;
}

export function ManageLinks({ slug }: { slug: string }) {
  const links = [
    { href: "attendees", label: "Attendees", icon: Users },
    { href: "check-in", label: "Check people in", icon: QrCode },
    { href: "broadcast", label: "Send an update", icon: Megaphone },
    { href: "analytics", label: "Analytics", icon: BarChart3 },
    { href: "edit", label: "Edit event", icon: Settings },
  ];
  return (
    <nav aria-label="Manage event" className="overflow-hidden rounded-lg border border-border bg-surface">
      <ul className="divide-y divide-border">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={`/events/manage/${slug}/${href}`}
              className="flex min-h-12 items-center gap-3 px-4 text-sm font-semibold text-fg transition-ui hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
            >
              <Icon aria-hidden="true" className="size-5 text-fg-muted" />
              <span className="flex-1">{label}</span>
              <ChevronRight aria-hidden="true" className="size-4 text-fg-subtle" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LatestRegistrations({
  slug,
  registrations,
}: {
  slug: string;
  registrations: ManageRegistration[];
}) {
  return (
    <section aria-labelledby="latest-title" className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="latest-title" className="text-lg font-bold text-fg">
          Latest sign-ups
        </h2>
        {registrations.length > 0 && (
          <Link
            href={`/events/manage/${slug}/attendees`}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-text hover:underline"
          >
            See all ({registrations.length})
          </Link>
        )}
      </div>
      {registrations.length > 0 ? (
        <ul className="mt-3 divide-y divide-border">
          {registrations.slice(0, 5).map((reg) => {
            const status = REG_STATUS[reg.status] ?? { label: reg.status, variant: "neutral" as const };
            const name = reg.profile?.displayName || "Student";
            return (
              <li key={reg.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="sm">
                    {reg.profile?.avatarUrl && <AvatarImage src={reg.profile.avatarUrl} alt="" />}
                    <AvatarFallback>{initialOf(name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg">{name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {reg.profile?.username ? `@${reg.profile.username}` : "No username"}
                      {reg.teamName && ` · Team ${reg.teamName}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span className="hidden text-xs text-fg-subtle sm:inline">
                    {formatTimeAgo(new Date(reg.createdAt))}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-fg-muted">No sign-ups yet. Share the link to get people in.</p>
      )}
    </section>
  );
}
