"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Globe,
  MapPin,
  Plus,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { cn, formatTimeAgo } from "@/lib/utils";

interface CategoryEventsClientProps {
  category: string;
  config: {
    title: string;
    headline: string;
    description: string;
    keywords: string[];
    canonicalCategory: string;
  };
}

interface EventItem {
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
  prizesDescription: string | null;
  attendeeCount: number;
  institution?: {
    name: string;
  } | null;
}

const ALL_CATEGORIES = [
  { slug: "hackathons", label: "Hackathons" },
  { slug: "workshops", label: "Workshops" },
  { slug: "fests", label: "College Fests" },
  { slug: "competitions", label: "Competitions" },
  { slug: "seminars", label: "Seminars" },
  { slug: "gaming", label: "Gaming / Esports" },
  { slug: "meetups", label: "Meetups" },
];

export function CategoryEventsClient({ category, config }: CategoryEventsClientProps) {
  const [modeFilter, setModeFilter] = useState<string>("ALL");

  const queryParams = new URLSearchParams();
  queryParams.set("category", category);
  if (modeFilter !== "ALL") queryParams.set("mode", modeFilter);

  const { data, isLoading } = useSWR<{ events: EventItem[] }>(
    `/api/events?${queryParams.toString()}`,
    fetcher
  );

  const events = data?.events || [];

  return (
    <div className="w-full max-w-5xl mx-auto py-6 space-y-6">
      {/* ─── Breadcrumb ─── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/events" className="hover:text-foreground transition-colors">
          Opportunities
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground capitalize">{category}</span>
      </div>

      {/* ─── Category Hero ─── */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border/40 bg-gradient-to-br from-card/80 to-card/30 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
              Campus Category Directory
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {config.headline}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {config.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/events/new"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="size-4" />
              <span>Host in {category}</span>
            </Link>
          </div>
        </div>

        {/* Category Jump Pills */}
        <div className="flex items-center gap-1.5 pt-4 border-t border-border/30 overflow-x-auto no-scrollbar">
          {ALL_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/events/category/${cat.slug}`}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                category === cat.slug
                  ? "bg-foreground text-background"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40"
              )}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Mode Switcher & Count ─── */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-muted-foreground">
          {events.length} opportunities listed
        </span>

        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-muted/60 border border-border/40">
          {(["ALL", "OFFLINE", "ONLINE", "HYBRID"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModeFilter(m)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                modeFilter === m
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "ALL" ? "All Modes" : m}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Events Feed ─── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          {events.map((ev) => {
            const startDateFormatted = new Date(ev.startDate).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <Link
                key={ev.id}
                href={`/events/${ev.slug || ev.id}`}
                className="group block p-4 sm:p-5 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/80 hover:border-primary/40 transition-all shadow-2xs space-y-3"
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase">
                          {ev.mode}
                        </span>
                        <span className="text-[11px] text-muted-foreground">· {ev.clubName}</span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {ev.title}
                      </h2>

                      <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" /> {startDateFormatted}
                        </span>
                        {ev.venue && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="size-3" /> {ev.venue}
                          </span>
                        )}
                        {ev.institution?.name && (
                          <span className="truncate max-w-[200px]">
                            · {ev.institution.name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30 shrink-0">
                    {ev.prizesDescription ? (
                      <span className="text-xs font-bold text-primary truncate max-w-[160px]">
                        {ev.prizesDescription}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Free Entry</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {ev.attendeeCount} Registered
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-border/60 p-8">
          <Compass className="size-10 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No events found in this category</h3>
            <p className="text-xs text-muted-foreground">
              Be the first to host an exciting campus event under {category}!
            </p>
          </div>
          <Link
            href="/events/new"
            className="inline-flex px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-xs"
          >
            Host new event →
          </Link>
        </div>
      )}
    </div>
  );
}
