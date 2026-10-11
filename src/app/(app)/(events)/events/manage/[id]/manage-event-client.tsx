"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Megaphone,
  QrCode,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { cn, formatTimeAgo } from "@/lib/utils";

interface ManageEventClientProps {
  eventId: string;
  initialSlug: string;
  currentProfile: {
    id: string;
    displayName: string;
    username: string;
    role: string;
  };
}

export function ManageEventClient({ eventId, initialSlug, currentProfile }: ManageEventClientProps) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{
    event: {
      id: string;
      slug: string;
      title: string;
      tagline: string | null;
      description: string | null;
      bannerUrl: string | null;
      clubName: string;
      eventType: string;
      mode: string;
      venue: string | null;
      meetingUrl: string | null;
      startDate: string;
      endDate: string;
      registrationDeadline: string | null;
      status: "PUBLISHED" | "DRAFT" | "COMPLETED" | "CANCELLED";
      visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
      maxParticipants: number | null;
      attendeeCount: number;
      registrations: Array<{
        id: string;
        profileId: string;
        registrationType: string;
        teamName: string | null;
        status: "CONFIRMED" | "ATTENDED" | "WAITLISTED" | "CANCELLED";
        createdAt: string;
        profile?: {
          id: string;
          displayName: string;
          username: string;
          avatarUrl: string | null;
          course: string | null;
          branch: string | null;
          year: number | null;
        } | null;
      }>;
    };
  }>(`/api/events/${eventId}`, fetcher);

  const event = data?.event;
  const slug = event?.slug || initialSlug;

  const registrations = event?.registrations || [];
  const attendeeCount = registrations.length;
  const attendedCount = registrations.filter((r) => r.status === "ATTENDED").length;
  const checkInRate = attendeeCount > 0 ? Math.round((attendedCount / attendeeCount) * 100) : 0;
  const capacityPercent = event?.maxParticipants
    ? Math.min(100, Math.round((attendeeCount / event.maxParticipants) * 100))
    : null;

  async function handleStatusChange(nextStatus: "PUBLISHED" | "COMPLETED" | "CANCELLED") {
    if (!event) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await mutate();
      toast.success(`Event status marked as ${nextStatus}`);
    } catch {
      toast.error("Could not update event status");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleDeleteEvent() {
    if (!event) return;
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this event? This action cannot be undone."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete event");
      toast.success("Event permanently deleted");
      router.push("/events/dashboard");
    } catch {
      toast.error("Could not delete event");
      setIsDeleting(false);
    }
  }

  function handleShareLink() {
    const url = `https://campusloop.space/events/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Public event link copied to clipboard");
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-8 space-y-6">
        <div className="h-6 w-32 bg-card/60 rounded animate-pulse" />
        <div className="h-44 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="w-full max-w-5xl mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-destructive">Failed to load event management data.</p>
        <Link
          href="/events/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
        >
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const startDateFormatted = new Date(event.startDate).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-6 space-y-6">
      {/* ─── Breadcrumb / Top Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Link
            href="/events/dashboard"
            className="p-2 rounded-xl border border-border/40 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Organizer Dashboard"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Organizer Hub</span>
              <span className="text-muted-foreground/60 text-xs">·</span>
              <span className="text-xs text-muted-foreground">{event.clubName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground truncate max-w-md sm:max-w-xl">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleShareLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted text-foreground text-xs font-bold transition-colors cursor-pointer"
          >
            <Share2 className="size-3.5" />
            <span>Copy Link</span>
          </button>

          <Link
            href={`/events/${slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted text-foreground text-xs font-bold transition-colors"
          >
            <span>Public Page</span>
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* ─── Hero Overview Card ─── */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {event.bannerUrl ? (
              <img
                src={event.bannerUrl}
                alt=""
                className="size-16 sm:size-20 rounded-2xl object-cover border border-border/40 shrink-0"
              />
            ) : (
              <div className="size-16 sm:size-20 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center border border-primary/20 shrink-0 text-base">
                {event.eventType.slice(0, 4)}
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                  {event.eventType}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase">
                  {event.mode}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    event.status === "PUBLISHED"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : event.status === "COMPLETED"
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        : event.status === "CANCELLED"
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  )}
                >
                  {event.status}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-foreground">{event.title}</h2>

              <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-primary" /> {startDateFormatted}
                </span>
                {event.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-muted-foreground" /> {event.venue}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Status Quick Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/50 shrink-0">
            <button
              type="button"
              disabled={isUpdatingStatus || event.status === "PUBLISHED"}
              onClick={() => handleStatusChange("PUBLISHED")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                event.status === "PUBLISHED"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Live
            </button>
            <button
              type="button"
              disabled={isUpdatingStatus || event.status === "COMPLETED"}
              onClick={() => handleStatusChange("COMPLETED")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                event.status === "COMPLETED"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Completed
            </button>
            <button
              type="button"
              disabled={isUpdatingStatus || event.status === "CANCELLED"}
              onClick={() => handleStatusChange("CANCELLED")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                event.status === "CANCELLED"
                  ? "bg-background text-destructive shadow-xs"
                  : "text-muted-foreground hover:text-destructive"
              )}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Capacity Progress Bar if maxParticipants is defined */}
        {event.maxParticipants && (
          <div className="pt-2 border-t border-border/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Attendee Capacity</span>
              <span className="font-bold text-foreground">
                {attendeeCount} / {event.maxParticipants} ({capacityPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Metric Strip ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" /> Total Registered
          </span>
          <p className="text-2xl font-black text-foreground">{attendeeCount}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-500" /> Checked In
          </span>
          <p className="text-2xl font-black text-foreground">{attendedCount}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <BarChart3 className="size-3.5 text-blue-500" /> Turnout Rate
          </span>
          <p className="text-2xl font-black text-foreground">{checkInRate}%</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Clock className="size-3.5 text-amber-500" /> Mode / Venue
          </span>
          <p className="text-sm font-bold text-foreground truncate">{event.venue || event.mode}</p>
        </div>
      </div>

      {/* Shortcuts */}
      <div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Card 1: Attendees Roster */}
          <Link
            href={`/events/manage/${slug}/attendees`}
            className="group p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/90 hover:border-primary/40 transition-all space-y-2.5 shadow-2xs"
          >
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
              <Users className="size-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Attendees</h4>
            </div>
          </Link>

          {/* Card 2: Live Venue Check-In */}
          <Link
            href={`/events/manage/${slug}/check-in`}
            className="group p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/90 hover:border-emerald-500/40 transition-all space-y-2.5 shadow-2xs"
          >
            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <QrCode className="size-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Check-in</h4>
            </div>
          </Link>

          {/* Card 3: Broadcast Updates */}
          <Link
            href={`/events/manage/${slug}/broadcast`}
            className="group p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/90 hover:border-amber-500/40 transition-all space-y-2.5 shadow-2xs"
          >
            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Megaphone className="size-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Announcements</h4>
            </div>
          </Link>

          {/* Card 4: Demographics & Analytics */}
          <Link
            href={`/events/manage/${slug}/analytics`}
            className="group p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/90 hover:border-blue-500/40 transition-all space-y-2.5 shadow-2xs"
          >
            <div className="size-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform">
              <BarChart3 className="size-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Analytics</h4>
            </div>
          </Link>

          {/* Card 5: Edit Event Form */}
          <Link
            href={`/events/manage/${slug}/edit`}
            className="group p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/90 hover:border-foreground/30 transition-all space-y-2.5 shadow-2xs"
          >
            <div className="size-9 rounded-xl bg-muted text-foreground flex items-center justify-center border border-border/50 group-hover:scale-105 transition-transform">
              <Settings className="size-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Edit event</h4>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent registrations */}
      <div className="p-5 rounded-2xl border border-border/40 bg-card/40 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recent registrations</h3>
          </div>
          <Link
            href={`/events/manage/${slug}/attendees`}
            className="text-xs font-bold text-primary hover:underline"
          >
            View all ({attendeeCount}) →
          </Link>
        </div>

        {registrations.length > 0 ? (
          <div className="divide-y divide-border/20">
            {registrations.slice(0, 5).map((reg) => (
              <div key={reg.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {reg.profile?.avatarUrl ? (
                    <img
                      src={reg.profile.avatarUrl}
                      alt=""
                      className="size-8 rounded-full object-cover shrink-0 border border-border/40"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                      {reg.profile?.displayName?.[0] || "S"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">
                      {reg.profile?.displayName || "Student Attendee"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      @{reg.profile?.username || "unknown"}
                      {reg.teamName && ` · Team: ${reg.teamName}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      reg.status === "ATTENDED"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : reg.status === "CANCELLED"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                    )}
                  >
                    {reg.status}
                  </span>
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    {formatTimeAgo(new Date(reg.createdAt))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No registrations received yet. Share your event link to get students on board!
          </div>
        )}
      </div>

      {/* ─── Danger Zone ─── */}
      <div className="p-4 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-destructive">Danger Zone</h4>
            <p className="text-[11px] text-muted-foreground">Permanently delete this event and attendee data</p>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDeleteEvent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-all cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>{isDeleting ? "Deleting..." : "Delete Event"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
