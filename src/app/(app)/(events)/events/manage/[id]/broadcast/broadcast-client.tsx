"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Send,
  Users,
} from "lucide-react";
import { fetcher } from "@/lib/api";

interface BroadcastClientProps {
  eventId: string;
  initialSlug: string;
  eventTitle: string;
}

interface DispatchLog {
  id: string;
  title: string;
  message: string;
  sentAt: string;
  recipientsCount: number;
}

export function BroadcastClient({ eventId, initialSlug, eventTitle }: BroadcastClientProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentHistory, setSentHistory] = useState<DispatchLog[]>([]);

  const { data } = useSWR<{
    event: {
      id: string;
      slug: string;
      title: string;
      attendeeCount: number;
      registrations: Array<{ id: string; status: string }>;
    };
  }>(`/api/events/${eventId}`, fetcher);

  const slug = data?.event?.slug || initialSlug;
  const activeAttendees = (data?.event?.registrations || []).filter((r) => r.status !== "CANCELLED").length;

  const TEMPLATES = [
    {
      label: "Room / Venue Update",
      title: "Venue Update",
      body: "Important update regarding the venue for our event: Please proceed to Auditorium Hall 2 instead of the seminar room.",
    },
    {
      label: "Starting Soon",
      title: "Starting in 15 Minutes!",
      body: "We are getting started in 15 minutes! Please head over to the venue and keep your student ticket pass ready for check-in.",
    },
    {
      label: "Community Group Link",
      title: "Join Official Discord / WhatsApp",
      body: "Join our official event group to connect with mentors, team up, and receive live announcements during the event.",
    },
    {
      label: "Closing & Prize Ceremony",
      title: "Closing Ceremony & Winners Announcement",
      body: "The project demos have concluded! Join us now in the main hall for the awards ceremony and prize announcements.",
    },
  ];

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a broadcast message");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          message: message.trim(),
        }),
      });

      const data = (await res.json()) as { error?: string; dispatchedCount: number };
      if (!res.ok) throw new Error(data.error || "Failed to send broadcast");

      toast.success(`Broadcast successfully sent to ${data.dispatchedCount} registered students!`);
      setSentHistory((prev) => [
        {
          id: Math.random().toString(),
          title: title.trim() || "Announcement",
          message: message.trim(),
          sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          recipientsCount: data.dispatchedCount,
        },
        ...prev,
      ]);

      setTitle("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to broadcast");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-6">
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
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
              In-App Broadcast
            </span>
            <h1 className="text-lg font-black text-foreground truncate">{eventTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-card text-xs font-semibold text-muted-foreground">
          <Users className="size-3.5 text-primary" />
          <span>{activeAttendees} Recipients</span>
        </div>
      </div>

      {/* ─── Quick Templates ─── */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Quick Preset Templates
        </label>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.label}
              type="button"
              onClick={() => {
                setTitle(tmpl.title);
                setMessage(tmpl.body);
              }}
              className="px-3 py-1.5 rounded-xl border border-border/50 bg-card hover:bg-muted text-foreground text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Composer Form ─── */}
      <form onSubmit={handleSendBroadcast} className="p-5 rounded-2xl border border-border/40 bg-card/40 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Announcement Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Schedule Update, Room Change..."
            className="w-full px-3.5 py-2 rounded-xl border border-border/50 bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Message Body <span className="text-destructive">*</span>
          </label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your update clearly for attendees..."
            className="w-full p-3.5 rounded-xl border border-border/50 bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
            required
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-muted-foreground">
            Delivers to {activeAttendees} confirmed attendees
          </span>

          <button
            type="submit"
            disabled={isSending || !message.trim() || activeAttendees === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                <span>Send Broadcast</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ─── Recent Dispatches Log ─── */}
      {sentHistory.length > 0 && (
        <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-3">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-500" /> Recently Sent Announcements
          </h3>

          <div className="space-y-2">
            {sentHistory.map((item) => (
              <div key={item.id} className="p-3 rounded-xl border border-border/30 bg-background/60 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground">{item.sentAt}</span>
                </div>
                <p className="text-muted-foreground">{item.message}</p>
                <p className="text-[10px] text-emerald-500 font-semibold">
                  Delivered to {item.recipientsCount} attendees
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
