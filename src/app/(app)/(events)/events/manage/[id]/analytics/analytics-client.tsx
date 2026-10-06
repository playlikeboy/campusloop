"use client";

import { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  GraduationCap,
  PieChart,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RegistrationItem {
  id: string;
  registrationType: "SOLO" | "TEAM";
  teamName: string | null;
  status: "CONFIRMED" | "ATTENDED" | "WAITLISTED" | "CANCELLED";
  createdAt: string;
  profile?: {
    id: string;
    course: string | null;
    branch: string | null;
    year: number | null;
    institution?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface AnalyticsClientProps {
  eventId: string;
  initialSlug: string;
  eventTitle: string;
}

export function AnalyticsClient({ eventId, initialSlug, eventTitle }: AnalyticsClientProps) {
  const { data, isLoading } = useSWR<{
    event: {
      id: string;
      slug: string;
      title: string;
      maxParticipants: number | null;
      registrations: RegistrationItem[];
    };
  }>(`/api/events/${eventId}`, fetcher);

  const registrations = data?.event?.registrations || [];
  const slug = data?.event?.slug || initialSlug;
  const maxCapacity = data?.event?.maxParticipants;

  // Demographics computations
  const total = registrations.length;
  const attended = registrations.filter((r) => r.status === "ATTENDED").length;
  const confirmed = registrations.filter((r) => r.status === "CONFIRMED").length;
  const cancelled = registrations.filter((r) => r.status === "CANCELLED").length;

  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;
  const capacityFillRate = maxCapacity ? Math.min(100, Math.round((total / maxCapacity) * 100)) : null;

  // Solo vs Team
  const soloCount = registrations.filter((r) => r.registrationType === "SOLO").length;
  const teamCount = registrations.filter((r) => r.registrationType === "TEAM").length;
  const soloPercent = total > 0 ? Math.round((soloCount / total) * 100) : 0;
  const teamPercent = total > 0 ? Math.round((teamCount / total) * 100) : 0;

  // College Distribution
  const collegeCounts = useMemo(() => {
    const map = new Map<string, number>();
    registrations.forEach((r) => {
      const name = r.profile?.institution?.name || "Campus Community";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [registrations, total]);

  // Year Distribution
  const yearCounts = useMemo(() => {
    const years: Record<string, number> = {
      "1st Year": 0,
      "2nd Year": 0,
      "3rd Year": 0,
      "4th Year": 0,
      "Other / PG": 0,
    };
    registrations.forEach((r) => {
      const y = r.profile?.year;
      if (y === 1) years["1st Year"]++;
      else if (y === 2) years["2nd Year"]++;
      else if (y === 3) years["3rd Year"]++;
      else if (y === 4) years["4th Year"]++;
      else years["Other / PG"]++;
    });
    return Object.entries(years).map(([label, count]) => ({
      label,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [registrations, total]);

  return (
    <div className="w-full max-w-5xl mx-auto py-6 space-y-6">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between pb-3 border-b border-border/30">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/events/manage/${slug}`}
            className="p-2 rounded-xl border border-border/40 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider block">
              Event Analytics
            </span>
            <h1 className="text-lg font-black text-foreground truncate">{eventTitle}</h1>
          </div>
        </div>

        <Link
          href={`/events/manage/${slug}/attendees`}
          className="text-xs font-bold text-primary hover:underline"
        >
          View Full Roster →
        </Link>
      </div>

      {/* ─── Metric Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" /> Total Registered
          </span>
          <p className="text-2xl font-black text-foreground">{total}</p>
          {maxCapacity && (
            <p className="text-[11px] text-muted-foreground">Capacity fill: {capacityFillRate}%</p>
          )}
        </div>

        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <UserCheck className="size-3.5 text-emerald-500" /> Attended / Checked-In
          </span>
          <p className="text-2xl font-black text-foreground">{attended}</p>
          <p className="text-[11px] text-emerald-500 font-semibold">{attendanceRate}% turnout</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-blue-500" /> Pending Confirmed
          </span>
          <p className="text-2xl font-black text-foreground">{confirmed}</p>
          <p className="text-[11px] text-muted-foreground">Awaiting check-in</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-purple-500" /> Solo vs. Team
          </span>
          <p className="text-2xl font-black text-foreground">
            {soloCount} <span className="text-xs text-muted-foreground font-normal">/ {teamCount}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">{soloPercent}% Solo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ─── Solo vs Team Participation Breakdown ─── */}
        <div className="p-5 rounded-2xl border border-border/40 bg-card/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <PieChart className="size-4 text-purple-500" /> Registration Mode
            </h2>
            <span className="text-xs text-muted-foreground">{total} total</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-foreground">Solo Registrations</span>
                <span className="text-muted-foreground">
                  {soloCount} ({soloPercent}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${soloPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-foreground">Team Registrations</span>
                <span className="text-muted-foreground">
                  {teamCount} ({teamPercent}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${teamPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Academic Year Distribution ─── */}
        <div className="p-5 rounded-2xl border border-border/40 bg-card/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="size-4 text-emerald-500" /> Academic Year Demographics
            </h2>
          </div>

          <div className="space-y-2.5">
            {yearCounts.map((yc) => (
              <div key={yc.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{yc.label}</span>
                  <span className="text-muted-foreground">
                    {yc.count} ({yc.percent}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${yc.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Top College Campus Representation ─── */}
      <div className="p-5 rounded-2xl border border-border/40 bg-card/40 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Building2 className="size-4 text-primary" /> Top Campus Representation
          </h2>
          <span className="text-xs text-muted-foreground">Colleges with highest registrations</span>
        </div>

        {collegeCounts.length > 0 ? (
          <div className="space-y-3">
            {collegeCounts.map((col, idx) => (
              <div key={col.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground truncate max-w-sm sm:max-w-md">
                    <span className="text-muted-foreground font-normal mr-1.5">#{idx + 1}</span>
                    {col.name}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {col.count} students ({col.percent}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${col.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-4 text-center">No campus breakdown available yet.</p>
        )}
      </div>
    </div>
  );
}
