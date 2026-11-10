"use client";

import { ExternalLink, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { MarkdownEditor } from "@/components/common/markdown-editor";
import { EVENT_STATUS, type EventStatus } from "@/components/events/event-status";
import { ManageHeader } from "@/components/events/manage-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { uploadImageToImgBB } from "@/lib/upload";
import {
  EVENT_TYPES,
  MODES,
  toLocalInput,
  VISIBILITY_OPTIONS,
  type Visibility,
} from "../../../new/event-form-options";
import { FormSection, OptionTiles } from "../../../new/form-parts";

interface EditEventClientProps {
  eventId: string;
  initialSlug: string;
}

interface EditableEvent {
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
  maxParticipants: number | null;
  prizesDescription: string | null;
  status: EventStatus;
  visibility: Visibility;
}

const toInput = (iso?: string | null) => (iso ? toLocalInput(new Date(iso)) : "");

function toForm(ev: EditableEvent) {
  return {
    title: ev.title || "",
    tagline: ev.tagline || "",
    description: ev.description || "",
    bannerUrl: ev.bannerUrl || "",
    clubName: ev.clubName || "",
    eventType: ev.eventType || "HACKATHON",
    mode: ev.mode || "OFFLINE",
    venue: ev.venue || "",
    meetingUrl: ev.meetingUrl || "",
    startDate: toInput(ev.startDate),
    endDate: toInput(ev.endDate),
    registrationDeadline: toInput(ev.registrationDeadline),
    maxParticipants: ev.maxParticipants ? String(ev.maxParticipants) : "",
    prizesDescription: ev.prizesDescription || "",
    status: ev.status || "PUBLISHED",
    visibility: ev.visibility || "PUBLIC",
  };
}

type EditForm = ReturnType<typeof toForm>;

export function EditEventClient({ eventId, initialSlug }: EditEventClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { data, error, isLoading, mutate } = useSWR<{ event: EditableEvent }>(
    `/api/events/${eventId}`,
    fetcher
  );

  useEffect(() => {
    if (data?.event) setForm(toForm(data.event));
  }, [data]);

  const slug = data?.event?.slug || initialSlug;
  const set = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  async function upload(file: File) {
    setIsUploading(true);
    try {
      const uploaded = await uploadImageToImgBB(file);
      set("bannerUrl", uploaded.url);
      toast.success("Poster uploaded.");
    } catch {
      toast.error("Upload failed. Try again, or paste an image link instead.");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim()) return void toast.error("Add a name for your event.");
    if (!form.startDate) return void toast.error("Add a start date and time.");
    if (form.endDate && new Date(form.endDate) < new Date(form.startDate))
      return void toast.error("The end time has to be after the start time.");

    setIsSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          tagline: form.tagline.trim() || null,
          description: form.description.trim() || null,
          bannerUrl: form.bannerUrl.trim() || null,
          clubName: form.clubName.trim() || "Campus Club",
          eventType: form.eventType,
          mode: form.mode,
          venue: form.venue.trim() || null,
          meetingUrl: form.meetingUrl.trim() || null,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate || form.startDate).toISOString(),
          registrationDeadline: form.registrationDeadline
            ? new Date(form.registrationDeadline).toISOString()
            : null,
          maxParticipants: form.maxParticipants ? Number.parseInt(form.maxParticipants, 10) : null,
          prizesDescription: form.prizesDescription.trim() || null,
          status: form.status,
          visibility: form.visibility,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Couldn't save your changes. Check your connection and try again.");
      }
      toast.success("Saved.");
      router.push(`/events/manage/${slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your changes. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || (!form && !error)) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <EmptyState
          title="This event didn't load"
          description="Check your connection and try again."
          action={<Button onClick={() => mutate()}>Try again</Button>}
        />
      </div>
    );
  }

  // Keep an older event's type selectable even if it is not in today's list.
  const typeOptions = EVENT_TYPES.some((t) => t.value === form.eventType)
    ? EVENT_TYPES
    : [
        ...EVENT_TYPES,
        { ...EVENT_TYPES[0], value: form.eventType, label: form.eventType.toLowerCase(), desc: "" },
      ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <ManageHeader
        slug={slug}
        title="Edit event"
        eventTitle={form.title}
        action={
          <Button asChild variant="ghost">
            <Link href={`/events/${slug}`} target="_blank">
              View
              <ExternalLink aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <FormSection title="Basics">
          <FormField label="Name" required>
            <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
          </FormField>
          <FormField label="One-line summary">
            <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </FormField>
          <FormField label="Club or society">
            <Input value={form.clubName} onChange={(e) => set("clubName", e.target.value)} />
          </FormField>
          <OptionTiles
            name="eventType"
            legend="Type"
            options={typeOptions}
            value={form.eventType}
            onChange={(v) => set("eventType", v)}
            columns="grid-cols-2 sm:grid-cols-4"
          />
          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <FormField label="Poster image link" className="flex-1">
                <Input
                  value={form.bannerUrl}
                  onChange={(e) => set("bannerUrl", e.target.value)}
                  placeholder="https://..."
                />
              </FormField>
              <Button
                type="button"
                variant="secondary"
                loading={isUploading}
                onClick={() => fileRef.current?.click()}
              >
                {!isUploading && <Upload aria-hidden="true" />}
                Upload
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
            </div>
            {form.bannerUrl && (
              <img
                src={form.bannerUrl}
                alt="Poster preview"
                className="h-32 w-full rounded-md border border-border object-cover"
              />
            )}
          </div>
        </FormSection>

        <FormSection title="When and where">
          <OptionTiles
            name="mode"
            legend="Format"
            options={MODES}
            value={form.mode}
            onChange={(v) => set("mode", v)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Venue">
              <Input
                value={form.venue}
                onChange={(e) => set("venue", e.target.value)}
                placeholder="e.g. Seminar hall, Block C"
              />
            </FormField>
            <FormField label="Meeting link">
              <Input
                type="url"
                value={form.meetingUrl}
                onChange={(e) => set("meetingUrl", e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Starts" required>
              <Input
                type="datetime-local"
                required
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </FormField>
            <FormField label="Ends">
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </FormField>
            <FormField label="Sign-ups close">
              <Input
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={(e) => set("registrationDeadline", e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Sign-ups and prizes">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Spots" hint="Leave empty for no limit.">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={form.maxParticipants}
                onChange={(e) => set("maxParticipants", e.target.value)}
              />
            </FormField>
            <FormField label="Prizes">
              <Input
                value={form.prizesDescription}
                onChange={(e) => set("prizesDescription", e.target.value)}
                placeholder="e.g. Certificates for everyone, prizes for the top 3"
              />
            </FormField>
          </div>
          <MarkdownEditor
            value={form.description}
            onChange={(v) => set("description", v)}
            placeholder="Schedule, rules, what to bring."
            rows={8}
          />
        </FormSection>

        <FormSection title="Status and visibility">
          <div className="overflow-x-auto no-scrollbar">
            <SegmentedControl<EventStatus>
              aria-label="Status"
              value={form.status}
              onChange={(v) => set("status", v)}
              options={(Object.keys(EVENT_STATUS) as EventStatus[]).map((s) => ({
                value: s,
                label: EVENT_STATUS[s].label,
              }))}
            />
          </div>
          <OptionTiles
            name="visibility"
            legend="Who can see it"
            options={VISIBILITY_OPTIONS}
            value={form.visibility}
            onChange={(v) => set("visibility", v)}
          />
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button asChild variant="ghost">
            <Link href={`/events/manage/${slug}`}>Cancel</Link>
          </Button>
          <Button type="submit" loading={isSaving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
