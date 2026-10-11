"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  QrCode,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface RegistrationItem {
  id: string;
  profileId: string;
  registrationType: "SOLO" | "TEAM";
  teamName: string | null;
  contactPhone: string | null;
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
    institution?: {
      name: string;
    } | null;
  } | null;
}

interface CheckInClientProps {
  eventId: string;
  initialSlug: string;
  eventTitle: string;
}

export function CheckInClient({ eventId, initialSlug, eventTitle }: CheckInClientProps) {
  const [search, setSearch] = useState("");
  const [viewTab, setViewTab] = useState<"PENDING" | "CHECKED_IN">("PENDING");
  const [admittingId, setAdmittingId] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<{
    event: {
      id: string;
      slug: string;
      title: string;
      registrations: RegistrationItem[];
    };
  }>(`/api/events/${eventId}`, fetcher);

  const registrations = data?.event?.registrations || [];
  const slug = data?.event?.slug || initialSlug;

  const pendingList = registrations.filter((r) => r.status === "CONFIRMED");
  const attendedList = registrations.filter((r) => r.status === "ATTENDED");

  const currentList = viewTab === "PENDING" ? pendingList : attendedList;

  const filtered = currentList.filter((reg) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = reg.profile?.displayName?.toLowerCase() || "";
    const user = reg.profile?.username?.toLowerCase() || "";
    const regId = reg.id.toLowerCase();
    const team = reg.teamName?.toLowerCase() || "";
    const phone = reg.contactPhone?.toLowerCase() || "";
    return name.includes(q) || user.includes(q) || regId.includes(q) || team.includes(q) || phone.includes(q);
  });

  async function handleAdmit(regId: string) {
    setAdmittingId(regId);
    try {
      sounds.pop();
      haptics.success();
      const res = await fetch(`/api/events/${eventId}/registrations/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ATTENDED" }),
      });
      if (!res.ok) throw new Error("Failed to check in");
      await mutate();
      toast.success("Attendee admitted successfully!");
    } catch {
      toast.error("Could not complete check-in");
    } finally {
      setAdmittingId(null);
    }
  }

  async function handleUndo(regId: string) {
    setAdmittingId(regId);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      if (!res.ok) throw new Error("Failed to undo check in");
      await mutate();
      toast.info("Check-in reversed to Confirmed");
    } catch {
      toast.error("Could not revert check-in");
    } finally {
      setAdmittingId(null);
    }
  }

  const totalAttendees = registrations.length;
  const totalAttended = attendedList.length;
  const progressPercent = totalAttendees > 0 ? Math.round((totalAttended / totalAttendees) * 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-5">
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
            <span className="text-[11px] font-medium text-muted-foreground block">
              Check-in
            </span>
            <h1 className="text-lg font-black text-foreground truncate">{eventTitle}</h1>
          </div>
        </div>

        <Link
          href={`/events/manage/${slug}/attendees`}
          className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border/40 bg-card shrink-0"
        >
          Full Roster
        </Link>
      </div>

      {/* ─── Live Admission Progress Banner ─── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-foreground">{totalAttended}</span>
              <span className="text-xs text-muted-foreground">/ {totalAttendees} admitted</span>
            </div>
          </div>

          <div className="size-12 rounded-full border-2 border-emerald-500/30 flex items-center justify-center font-black text-sm text-emerald-500 bg-background/80">
            {progressPercent}%
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ─── Search Omnibar ─── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Lookup by student name, @username, or ticket ID..."
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-border/60 bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
          autoFocus
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* ─── Tab Switcher ─── */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/40">
        <button
          type="button"
          onClick={() => setViewTab("PENDING")}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
            viewTab === "PENDING"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="size-3.5 text-amber-500" />
          <span>Pending Admission ({pendingList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab("CHECKED_IN")}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
            viewTab === "CHECKED_IN"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span>Admitted ({attendedList.length})</span>
        </button>
      </div>

      {/* ─── Admission List ─── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2.5">
          {filtered.map((reg) => (
            <div
              key={reg.id}
              className="p-3.5 sm:p-4 rounded-2xl border border-border/40 bg-card/50 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {reg.profile?.avatarUrl ? (
                  <img
                    src={reg.profile.avatarUrl}
                    alt=""
                    className="size-10 rounded-full object-cover shrink-0 border border-border/40"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                    {reg.profile?.displayName?.[0] || "S"}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">
                    {reg.profile?.displayName || "Student"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    @{reg.profile?.username || "student"}
                    {reg.teamName && ` · Team: ${reg.teamName}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 truncate">
                    ID: {reg.id.slice(0, 10)}... · {reg.profile?.institution?.name || "Campus"}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {viewTab === "PENDING" ? (
                  <button
                    type="button"
                    disabled={admittingId === reg.id}
                    onClick={() => handleAdmit(reg.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <UserCheck className="size-4" />
                    <span>Admit</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={admittingId === reg.id}
                    onClick={() => handleUndo(reg.id)}
                    className="px-3 py-1.5 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-2 rounded-2xl border border-dashed border-border/50 p-6">
          <QrCode className="size-8 text-muted-foreground/40 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">
            {viewTab === "PENDING" ? "No pending attendees" : "No admitted attendees yet"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {search ? "No students matching your search query." : "All attendees are already processed!"}
          </p>
        </div>
      )}
    </div>
  );
}
