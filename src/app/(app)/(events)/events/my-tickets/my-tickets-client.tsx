"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  QrCode,
  Ticket,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { cn, formatTimeAgo } from "@/lib/utils";

interface TicketEvent {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  bannerUrl: string | null;
  clubName: string;
  eventType: string;
  mode: string;
  venue: string | null;
  meetingUrl: string | null;
  startDate: string;
  endDate: string;
  isRegistered: boolean;
  status: string;
  userRegistration?: {
    id: string;
    registrationType: "SOLO" | "TEAM";
    teamName: string | null;
    status: "CONFIRMED" | "ATTENDED" | "WAITLISTED" | "CANCELLED";
    createdAt: string;
  } | null;
}

export function MyTicketsClient({
  profile,
}: {
  profile: {
    id: string;
    displayName: string;
    username: string;
    institution?: { name: string } | null;
  };
}) {
  const [filter, setFilter] = useState<"UPCOMING" | "PAST">("UPCOMING");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR<{ events: TicketEvent[] }>(
    "/api/events?scope=REGISTERED",
    fetcher
  );

  const events = data?.events || [];
  const now = Date.now();

  const filteredEvents = events.filter((ev) => {
    const endMs = new Date(ev.endDate).getTime();
    if (filter === "UPCOMING") return endMs >= now;
    return endMs < now;
  });

  async function handleCancelRegistration(eventId: string, eventTitle: string) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your registration for "${eventTitle}"? Your pass will be revoked.`
    );
    if (!confirmed) return;

    setCancellingId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to cancel registration");
      await mutate();
      toast.success("Registration cancelled successfully");
    } catch {
      toast.error("Could not cancel registration");
    } finally {
      setCancellingId(null);
    }
  }

  function getGoogleCalendarUrl(ev: TicketEvent) {
    const startIso = new Date(ev.startDate).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endIso = new Date(ev.endDate).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(ev.title);
    const details = encodeURIComponent(
      `CampusLoop Registered Pass: ${ev.title} hosted by ${ev.clubName}.\nMore details: https://campusloop.space/events/${ev.slug || ev.id}`
    );
    const location = encodeURIComponent(ev.venue || ev.mode);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6 space-y-6">
      {/* ─── Top Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Link
            href="/events"
            className="p-2 rounded-xl border border-border/40 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Browse Opportunities"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">My tickets</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/events/dashboard"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted text-foreground text-xs font-bold transition-colors"
          >
            <Calendar className="size-3.5 text-primary" />
            <span>My events</span>
          </Link>

          <Link
            href="/events"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-xs"
          >
            <span>Explore Events</span>
          </Link>
        </div>
      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="flex items-center gap-1.5 pb-2 border-b border-border/30">
        <button
          type="button"
          onClick={() => setFilter("UPCOMING")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
            filter === "UPCOMING"
              ? "bg-foreground text-background"
              : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40"
          )}
        >
          Upcoming Events ({events.filter((e) => new Date(e.endDate).getTime() >= now).length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("PAST")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
            filter === "PAST"
              ? "bg-foreground text-background"
              : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40"
          )}
        >
          Past Events ({events.filter((e) => new Date(e.endDate).getTime() < now).length})
        </button>
      </div>

      {/* ─── Tickets Feed ─── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((ev) => {
            const startDateFormatted = new Date(ev.startDate).toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const startTimeFormatted = new Date(ev.startDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            const userReg = ev.userRegistration;
            const regStatus = userReg?.status || "CONFIRMED";

            return (
              <div
                key={ev.id}
                className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden shadow-2xs hover:border-primary/40 transition-all"
              >
                {/* Perforated Notch Left & Right */}
                <div className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full bg-background border border-border/60 z-10" />
                <div className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full bg-background border border-border/60 z-10" />

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {ev.bannerUrl ? (
                        <img
                          src={ev.bannerUrl}
                          alt=""
                          className="size-16 sm:size-20 rounded-2xl object-cover shrink-0 border border-border/40"
                        />
                      ) : (
                        <div className="size-16 sm:size-20 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 border border-primary/20 text-base">
                          {ev.eventType.slice(0, 4)}
                        </div>
                      )}

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                            {ev.eventType}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase">
                            {ev.mode}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              regStatus === "ATTENDED"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            )}
                          >
                            {regStatus === "ATTENDED" ? "Checked In" : "Confirmed Pass"}
                          </span>
                        </div>

                        <h2 className="text-base sm:text-lg font-bold text-foreground">
                          {ev.title}
                        </h2>

                        <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <Calendar className="size-3.5 text-primary" /> {startDateFormatted} at {startTimeFormatted}
                          </span>
                          {ev.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5 text-muted-foreground" /> {ev.venue}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Pass Stub Info */}
                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start border-t sm:border-t-0 pt-2 sm:pt-0 border-border/20 text-xs">
                      <span className="text-muted-foreground">Attendee Name</span>
                      <p className="font-bold text-foreground">{profile.displayName}</p>
                      {userReg?.teamName && (
                        <p className="text-[11px] text-primary font-semibold">
                          Team: {userReg.teamName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pass Controls Bar */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-dashed border-border/40 flex-wrap text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={getGoogleCalendarUrl(ev)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-background hover:bg-muted text-foreground font-semibold transition-colors"
                      >
                        <Calendar className="size-3.5 text-primary" />
                        <span>Add to Google Calendar</span>
                      </a>

                      {ev.meetingUrl && (
                        <a
                          href={ev.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 font-bold transition-colors"
                        >
                          <Video className="size-3.5" />
                          <span>Join Virtual Meeting</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/events/${ev.slug || ev.id}`}
                        target="_blank"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>Event Page</span>
                        <ExternalLink className="size-3" />
                      </Link>

                      {filter === "UPCOMING" && (
                        <button
                          type="button"
                          disabled={cancellingId === ev.id}
                          onClick={() => handleCancelRegistration(ev.id, ev.title)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Cancel Registration"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-border/60 p-8">
          <Ticket className="size-10 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No passes found</h3>
            <p className="text-xs text-muted-foreground">
              You haven&apos;t registered for any {filter.toLowerCase()} campus opportunities yet.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-xs"
          >
            Explore upcoming campus hackathons & fests →
          </Link>
        </div>
      )}
    </div>
  );
}
