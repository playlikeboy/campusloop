/* biome-ignore-all lint/suspicious/noExplicitAny: the event API returns an untyped payload */
"use client";

import { CalendarDays, ExternalLink, Gift, MapPin, School, Trophy, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { MarkdownContent } from "@/components/common/markdown-content";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/lib/utils";
import { eventModeLabel } from "./event-card";

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-fg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-fg-muted" aria-hidden />
      <div className="min-w-0">
        <dt className="text-sm text-fg-muted">{label}</dt>
        <dd className="text-base font-medium text-fg">{children}</dd>
      </div>
    </div>
  );
}

export function EventFacts({ event }: { event: any }) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const date = start.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = `${start.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
  const restricted =
    Array.isArray(event.eligibleInstitutionIds) && !event.eligibleInstitutionIds.includes("ALL");
  const meetingUrl =
    typeof event.meetingUrl === "string" && event.meetingUrl.startsWith("http") ? event.meetingUrl : null;
  const joinAs =
    event.participationType === "BOTH"
      ? "Solo or as a team"
      : event.participationType === "TEAM"
        ? `Teams of ${event.minTeamSize || 1} to ${event.maxTeamSize || 4}`
        : "Solo";

  return (
    <dl className="divide-y divide-border">
      <Fact icon={CalendarDays} label="When">
        {date}
        <span className="block text-sm font-normal tabular-nums text-fg-muted">{time}</span>
      </Fact>
      <Fact icon={MapPin} label="Where">
        {event.venue || eventModeLabel(event.mode)}
        {meetingUrl && (
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-text hover:underline"
          >
            Open event link <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </Fact>
      <Fact icon={School} label="Who can join">
        {restricted ? "Students from selected colleges" : "Students from any college"}
      </Fact>
      <Fact icon={Users} label="Join as">
        {joinAs}
        {event.maxParticipants ? (
          <span className="block text-sm font-normal text-fg-muted">{event.maxParticipants} spots</span>
        ) : null}
      </Fact>
    </dl>
  );
}

export function EventPrizes({ event }: { event: any }) {
  const perks: string[] = Array.isArray(event.perks) ? event.perks : [];
  if (!event.prizesDescription && perks.length === 0) return null;
  return (
    <Section title="Prizes and perks">
      {event.prizesDescription && (
        <p className="flex items-start gap-2 text-base text-fg">
          <Trophy className="mt-0.5 size-5 shrink-0 text-fg-muted" aria-hidden />
          {event.prizesDescription}
        </p>
      )}
      {perks.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {perks.map((perk, idx) => (
            <li
              key={`${perk}-${idx}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-sm text-fg"
            >
              <Gift className="size-3.5 text-fg-muted" aria-hidden />
              {perk}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function EventAbout({ description }: { description?: string | null }) {
  if (!description?.trim()) return null;
  return (
    <Section title="About">
      <div className="max-w-[68ch] text-base leading-relaxed text-fg">
        <MarkdownContent content={description} />
      </div>
    </Section>
  );
}

export function EventHost({ event }: { event: any }) {
  const host = event.organizer;
  if (!host) return null;
  return (
    <Section title="Hosted by">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-11">
            <AvatarImage src={getAvatarUrl(host.avatarUrl, host.username)} alt="" />
            <AvatarFallback>{host.displayName?.[0] || "H"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{host.displayName}</p>
            <p className="truncate text-sm text-fg-muted">
              @{host.username} · {event.clubName}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/@${host.username}`}>View profile</Link>
        </Button>
      </div>
    </Section>
  );
}

export function EventAttendees({ registrations }: { registrations?: any[] }) {
  if (!registrations?.length) return null;
  return (
    <Section title={`Going (${registrations.length})`}>
      <ul className="flex flex-wrap gap-2">
        {registrations.slice(0, 18).map((r) => (
          <li key={r.id}>
            <Link
              href={`/@${r.profile?.username}`}
              className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3 pl-1.5 text-sm transition-ui hover:bg-surface-muted"
            >
              <Avatar className="size-7">
                <AvatarImage src={getAvatarUrl(r.profile?.avatarUrl, r.profile?.username)} alt="" />
                <AvatarFallback className="text-xs">{r.profile?.displayName?.[0] || "S"}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-fg">@{r.profile?.username}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function EventRelated({ related }: { related: any[] }) {
  if (!related.length) return null;
  return (
    <Section
      title="More like this"
      action={
        <Button asChild variant="link" size="sm">
          <Link href="/events">See all</Link>
        </Button>
      }
    >
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {related.map((rel) => (
          <li key={rel.id}>
            <Link
              href={`/events/${rel.slug || rel.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-ui hover:bg-surface-muted"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-fg">{rel.title}</span>
                <span className="block truncate text-sm text-fg-muted">
                  {rel.clubName} · {eventModeLabel(rel.mode)}
                </span>
              </span>
              <span className="shrink-0 text-right text-sm tabular-nums text-fg-muted">
                {new Date(rel.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                <span className="block text-fg">{rel.entryFee || "Free"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
