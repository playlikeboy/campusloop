"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { cn, formatTimeAgo } from "@/lib/utils";

interface RegistrationItem {
  id: string;
  profileId: string;
  registrationType: "SOLO" | "TEAM";
  teamName: string | null;
  teamMembers: string[] | null;
  contactPhone: string | null;
  notes: string | null;
  status: "CONFIRMED" | "ATTENDED" | "WAITLISTED" | "CANCELLED";
  createdAt: string;
  profile?: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    email: string | null;
    course: string | null;
    branch: string | null;
    year: number | null;
    institution?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface AttendeesClientProps {
  eventId: string;
  initialSlug: string;
  eventTitle: string;
}

export function AttendeesClient({ eventId, initialSlug, eventTitle }: AttendeesClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const filtered = registrations.filter((reg) => {
    if (statusFilter !== "ALL" && reg.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = reg.profile?.displayName?.toLowerCase() || "";
      const user = reg.profile?.username?.toLowerCase() || "";
      const email = reg.profile?.email?.toLowerCase() || "";
      const team = reg.teamName?.toLowerCase() || "";
      const college = reg.profile?.institution?.name?.toLowerCase() || "";
      if (!name.includes(q) && !user.includes(q) && !email.includes(q) && !team.includes(q) && !college.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const confirmedCount = registrations.filter((r) => r.status === "CONFIRMED" || r.status === "ATTENDED").length;
  const attendedCount = registrations.filter((r) => r.status === "ATTENDED").length;

  async function handleUpdateStatus(regId: string, nextStatus: "CONFIRMED" | "ATTENDED" | "CANCELLED") {
    setUpdatingId(regId);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await mutate();
      toast.success(`Registration status updated to ${nextStatus}`);
    } catch {
      toast.error("Could not update attendee status");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleExportCsv() {
    if (registrations.length === 0) {
      toast.error("No attendees to export");
      return;
    }

    const headers = [
      "Registration ID",
      "Full Name",
      "Username",
      "Email",
      "Phone",
      "College / Campus",
      "Course & Branch",
      "Year",
      "Registration Type",
      "Team Name",
      "Status",
      "Registered At",
    ];

    const rows = registrations.map((r) => [
      `"${r.id}"`,
      `"${(r.profile?.displayName || "").replace(/"/g, '""')}"`,
      `"${(r.profile?.username || "").replace(/"/g, '""')}"`,
      `"${(r.profile?.email || "").replace(/"/g, '""')}"`,
      `"${(r.contactPhone || "").replace(/"/g, '""')}"`,
      `"${(r.profile?.institution?.name || "").replace(/"/g, '""')}"`,
      `"${(`${r.profile?.course || ""} ${r.profile?.branch || ""}`).trim().replace(/"/g, '""')}"`,
      `"${r.profile?.year || ""}"`,
      `"${r.registrationType}"`,
      `"${(r.teamName || "").replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${new Date(r.createdAt).toISOString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${eventTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendee CSV downloaded successfully");
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-6 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Link
            href={`/events/manage/${slug}`}
            className="p-2 rounded-xl border border-border/40 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Event Management"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Attendees</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground truncate max-w-md sm:max-w-xl">
              {eventTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted text-foreground text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="size-3.5 text-primary" />
            <span>Export CSV</span>
          </button>

          <Link
            href={`/events/manage/${slug}/check-in`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
          >
            <UserCheck className="size-3.5" />
            <span>Check-in</span>
          </Link>
        </div>
      </div>

      {/* ─── Summary Counters ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-border/40 bg-card/40 space-y-0.5">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <Users className="size-3 text-primary" /> Total Registrations
          </span>
          <p className="text-xl font-black text-foreground">{registrations.length}</p>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/40 bg-card/40 space-y-0.5">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <CheckCircle2 className="size-3 text-blue-500" /> Confirmed
          </span>
          <p className="text-xl font-black text-foreground">{confirmedCount}</p>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/40 bg-card/40 space-y-0.5">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <UserCheck className="size-3 text-emerald-500" /> Attended / Present
          </span>
          <p className="text-xl font-black text-foreground">{attendedCount}</p>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/40 bg-card/40 space-y-0.5">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <Clock className="size-3 text-amber-500" /> Attendance Rate
          </span>
          <p className="text-xl font-black text-foreground">
            {registrations.length > 0 ? Math.round((attendedCount / registrations.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* ─── Filter & Search Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, @username, email, or team..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(["ALL", "CONFIRMED", "ATTENDED", "CANCELLED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                statusFilter === tab
                  ? "bg-foreground text-background"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40"
              )}
            >
              {tab === "ALL" ? "All" : tab === "CONFIRMED" ? "Confirmed" : tab === "ATTENDED" ? "Attended" : "Cancelled"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Attendees Table & Cards ─── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/30 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Academic Background</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filtered.map((reg) => (
                  <tr key={reg.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
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
                            @{reg.profile?.username || "student"}
                            {reg.profile?.email ? ` · ${reg.profile.email}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">
                      <p className="truncate font-medium text-foreground">
                        {reg.profile?.institution?.name || "Campus Community"}
                      </p>
                      <p className="text-[11px] truncate">
                        {reg.profile?.course || ""} {reg.profile?.branch || ""}{" "}
                        {reg.profile?.year ? `(Year ${reg.profile.year})` : ""}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                          {reg.registrationType}
                        </span>
                        {reg.teamName && (
                          <p className="text-[11px] font-semibold text-foreground truncate max-w-[140px]">
                            Team: {reg.teamName}
                          </p>
                        )}
                        {reg.contactPhone && (
                          <p className="text-[10px] text-muted-foreground">{reg.contactPhone}</p>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                          reg.status === "ATTENDED"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : reg.status === "CANCELLED"
                              ? "bg-destructive/10 text-destructive border border-destructive/20"
                              : "bg-primary/10 text-primary border border-primary/20"
                        )}
                      >
                        {reg.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {reg.status !== "ATTENDED" ? (
                          <button
                            type="button"
                            disabled={updatingId === reg.id}
                            onClick={() => handleUpdateStatus(reg.id, "ATTENDED")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all cursor-pointer"
                            title="Mark as Checked In"
                          >
                            Mark Present
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingId === reg.id}
                            onClick={() => handleUpdateStatus(reg.id, "CONFIRMED")}
                            className="px-2.5 py-1 rounded-lg border border-border/50 bg-background hover:bg-muted text-muted-foreground text-[11px] font-medium transition-colors cursor-pointer"
                            title="Reset to Confirmed"
                          >
                            Undo Check-In
                          </button>
                        )}

                        {reg.status !== "CANCELLED" && (
                          <button
                            type="button"
                            disabled={updatingId === reg.id}
                            onClick={() => handleUpdateStatus(reg.id, "CANCELLED")}
                            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Cancel Registration"
                          >
                            <UserX className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((reg) => (
              <div
                key={reg.id}
                className="p-4 rounded-2xl border border-border/40 bg-card/50 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
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
                      <p className="font-bold text-foreground truncate">
                        {reg.profile?.displayName || "Student Attendee"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        @{reg.profile?.username || "student"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {reg.profile?.institution?.name}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0",
                      reg.status === "ATTENDED"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : reg.status === "CANCELLED"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                    )}
                  >
                    {reg.status}
                  </span>
                </div>

                {reg.teamName && (
                  <p className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg">
                    Team: <span className="font-semibold text-foreground">{reg.teamName}</span>
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/20">
                  <span className="text-[11px] text-muted-foreground">
                    {formatTimeAgo(new Date(reg.createdAt))}
                  </span>

                  <div className="flex items-center gap-2">
                    {reg.status !== "ATTENDED" ? (
                      <button
                        type="button"
                        disabled={updatingId === reg.id}
                        onClick={() => handleUpdateStatus(reg.id, "ATTENDED")}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Check In
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={updatingId === reg.id}
                        onClick={() => handleUpdateStatus(reg.id, "CONFIRMED")}
                        className="px-3 py-1 rounded-lg border border-border/50 text-muted-foreground text-xs cursor-pointer"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center space-y-2 rounded-2xl border border-dashed border-border/50 p-6">
          <Users className="size-8 text-muted-foreground/50 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No matching attendees</h3>
          <p className="text-xs text-muted-foreground">Try clearing your search or status filter.</p>
        </div>
      )}
    </div>
  );
}
