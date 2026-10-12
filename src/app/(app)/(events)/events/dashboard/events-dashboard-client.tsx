"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Megaphone,
  Plus,
  QrCode,
  Settings,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

interface HostedEvent {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  bannerUrl: string | null;
  clubName: string;
  eventType: string;
  mode: string;
  venue: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  status: "PUBLISHED" | "DRAFT" | "COMPLETED" | "CANCELLED";
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  attendeeCount: number;
  attendedCount: number;
  confirmedCount: number;
  maxParticipants: number | null;
  createdAt: string;
}

export function EventsDashboardClient({
  profile,
}: {
  profile: {
    id: string;
    displayName: string;
    username: string;
    institution?: { name: string } | null;
  };
}) {
  const [filter, setFilter] = useState<"ALL" | "PUBLISHED" | "COMPLETED" | "DRAFT">("ALL");

  const { data, error, isLoading, mutate } = useSWR<{ events: HostedEvent[] }>(
    "/api/events?scope=HOSTED",
    fetcher
  );

  const events = data?.events || [];

  const filteredEvents = events.filter((ev) => {
    if (filter === "ALL") return true;
    return ev.status === filter;
  });

  // KPI calculations
  const totalHosted = events.length;
  const totalRegistrations = events.reduce((acc, ev) => acc + (ev.attendeeCount || 0), 0);
  const totalCheckedIn = events.reduce((acc, ev) => acc + (ev.attendedCount || 0), 0);

  return (
    <div className="w-full max-w-6xl mx-auto py-6 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/30">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            My events
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/events/my-tickets"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/60 bg-card text-foreground text-xs font-bold hover:bg-muted transition-colors"
          >
            <Ticket className="size-3.5 text-primary" />
            <span>Tickets</span>
          </Link>
          <Link
            href="/events/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-xs active:scale-95"
          >
            <Plus className="size-4" />
            <span>Host event</span>
          </Link>
        </div>
      </div>

      {/* ─── KPI Metrics ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" /> Total Events
          </span>
          <p className="text-2xl font-black text-foreground">{totalHosted}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Users className="size-3.5 text-blue-500" /> Registrations
          </span>
          <p className="text-2xl font-black text-foreground">{totalRegistrations}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-500" /> Checked In
          </span>
          <p className="text-2xl font-black text-foreground">{totalCheckedIn}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-purple-500" /> Host Campus
          </span>
          <p className="text-sm font-bold text-foreground truncate">
            {profile.institution?.name?.split(",")[0] || "Campus Hub"}
          </p>
        </div>
      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="flex items-center gap-1.5 pb-2 border-b border-border/30 overflow-x-auto no-scrollbar">
        {(["ALL", "PUBLISHED", "COMPLETED", "DRAFT"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              filter === tab
                ? "bg-foreground text-background"
                : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40"
            )}
          >
            {tab === "ALL" ? "All Hosted Events" : tab === "PUBLISHED" ? "Live / Published" : tab === "COMPLETED" ? "Past Events" : "Drafts"}
          </button>
        ))}
      </div>

      {/* ─── Events Grid / List ─── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-border/30 bg-card/30 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-3">
          {filteredEvents.map((ev) => {
            const startDateFormatted = new Date(ev.startDate).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={ev.id}
                className="p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/80 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {ev.bannerUrl ? (
                      <img
                        src={ev.bannerUrl}
                        alt=""
                        className="size-14 sm:size-16 rounded-xl object-cover shrink-0 border border-border/40"
                      />
                    ) : (
                      <div className="size-14 sm:size-16 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 border border-primary/20 text-sm">
                        {ev.eventType.slice(0, 4)}
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                          {ev.eventType}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            ev.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : ev.status === "DRAFT"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {ev.status}
                        </span>
                        <span className="text-[11px] text-muted-foreground">· {ev.clubName}</span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                        {ev.title}
                      </h2>

                      <p className="text-xs text-muted-foreground flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" /> {startDateFormatted}
                        </span>
                        {ev.venue && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="size-3" /> {ev.venue}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Registrations pill */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30">
                    <span className="text-xs text-muted-foreground">Registrations</span>
                    <p className="text-base font-black text-foreground">
                      {ev.attendeeCount}{" "}
                      {ev.maxParticipants ? (
                        <span className="text-xs text-muted-foreground font-normal">/ {ev.maxParticipants}</span>
                      ) : null}
                    </p>
                  </div>
                </div>

                {/* Quick Management Actions Strip */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-border/30 flex-wrap text-xs font-semibold">
                  <Link
                    href={`/events/manage/${ev.slug || ev.id}`}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-2xs"
                  >
                    Manage Hub
                  </Link>

                  <Link
                    href={`/events/manage/${ev.slug || ev.id}/attendees`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted text-foreground transition-colors"
                  >
                    <Users className="size-3.5 text-primary" />
                    <span>Attendees ({ev.attendeeCount})</span>
                  </Link>

                  <Link
                    href={`/events/manage/${ev.slug || ev.id}/check-in`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted text-foreground transition-colors"
                  >
                    <QrCode className="size-3.5 text-emerald-500" />
                    <span>Check-In</span>
                  </Link>

                  <Link
                    href={`/events/manage/${ev.slug || ev.id}/broadcast`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted text-foreground transition-colors"
                  >
                    <Megaphone className="size-3.5 text-amber-500" />
                    <span>Broadcast</span>
                  </Link>

                  <Link
                    href={`/events/manage/${ev.slug || ev.id}/edit`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted text-foreground transition-colors"
                  >
                    <Settings className="size-3.5 text-muted-foreground" />
                    <span>Edit</span>
                  </Link>

                  <Link
                    href={`/events/${ev.slug || ev.id}`}
                    target="_blank"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors ml-auto"
                    title="View Public Event Page"
                  >
                    <span>Public Page</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 rounded-2xl border border-dashed border-border/60 p-8">
          <Calendar className="size-10 text-muted-foreground/50" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No events found</h3>
            <p className="text-xs text-muted-foreground">
              You haven&apos;t hosted any events matching this filter yet.
            </p>
          </div>
          <Link
            href="/events/new"
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-xs"
          >
            Host your first campus event →
          </Link>
        </div>
      )}
    </div>
  );
}
