"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ManageHeader } from "@/components/events/manage-header";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";

interface BroadcastClientProps {
  eventId: string;
  initialSlug: string;
  eventTitle: string;
}

interface SentMessage {
  id: string;
  title: string;
  message: string;
  sentAt: string;
  recipientsCount: number;
}

const TEMPLATES = [
  { label: "Venue change", title: "Venue change", body: "We've moved to [new room]. See you there." },
  {
    label: "Starting soon",
    title: "Starting in 15 minutes",
    body: "We start in 15 minutes. Head to the venue and keep your ticket ready for check-in.",
  },
  {
    label: "Group link",
    title: "Join the event group",
    body: "Join the group for updates and to find teammates: [link]",
  },
  { label: "Results", title: "Results time", body: "Demos are done. Come to [place] for the results." },
];

export function BroadcastClient({ eventId, initialSlug, eventTitle }: BroadcastClientProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState<SentMessage[]>([]);

  const { data } = useSWR<{ event: { slug: string; registrations: Array<{ id: string; status: string }> } }>(
    `/api/events/${eventId}`,
    fetcher
  );
  const slug = data?.event?.slug || initialSlug;
  const recipients = (data?.event?.registrations || []).filter((r) => r.status !== "CANCELLED").length;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Write a message first.");
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined, message: message.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; dispatchedCount?: number };
      if (!res.ok) throw new Error(body.error || "Couldn't send. Check your connection and try again.");
      const count = body.dispatchedCount ?? 0;
      toast.success(`Sent to ${count} ${count === 1 ? "person" : "people"}.`);
      setSent((prev) => [
        {
          id: crypto.randomUUID(),
          title: title.trim() || "Update",
          message: message.trim(),
          sentAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          recipientsCount: count,
        },
        ...prev,
      ]);
      setTitle("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send. Check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <ManageHeader slug={slug} title="Send an update" eventTitle={eventTitle} />

      <fieldset>
        <legend className="text-sm font-semibold text-fg">Start from</legend>
        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TEMPLATES.map((t) => (
            <Chip
              key={t.label}
              onClick={() => {
                setTitle(t.title);
                setMessage(t.body);
              }}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <form onSubmit={send} className="space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-5">
        <FormField label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Room change" />
        </FormField>
        <FormField label="Message" required>
          <Textarea
            rows={5}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What do people need to know?"
          />
        </FormField>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">
            {recipients === 0
              ? "No one has signed up yet."
              : `Goes to ${recipients} ${recipients === 1 ? "person" : "people"} who signed up.`}
          </p>
          <Button type="submit" loading={isSending} disabled={!message.trim() || recipients === 0}>
            {!isSending && <Send aria-hidden="true" />}
            Send
          </Button>
        </div>
      </form>

      {sent.length > 0 && (
        <section aria-labelledby="sent-title" className="space-y-3">
          <h2 id="sent-title" className="text-lg font-bold text-fg">
            Sent
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {sent.map((item) => (
              <li key={item.id} className="space-y-1 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-fg">{item.title}</span>
                  <span className="text-xs text-fg-subtle">{item.sentAt}</span>
                </div>
                <p className="text-fg-muted">{item.message}</p>
                <p className="text-xs text-fg-muted">Sent to {item.recipientsCount}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
