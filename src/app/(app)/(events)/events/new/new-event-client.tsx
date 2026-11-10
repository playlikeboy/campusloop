"use client";

import { ArrowLeft, Building2, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { BasicsSection, PosterSection, WhereSection } from "./event-form-basics";
import { DetailsSection, PrizesSection, WhenSection, WhoSection } from "./event-form-details";
import { type EventFormState, INITIAL_FORM, restoreDraft, type SetField } from "./event-form-options";
import { type ChecklistItem, EventPreview, ReadinessList } from "./event-preview";

const DRAFT_KEY = "campusloop:event-draft";

function validate(f: EventFormState, isExternal: boolean): string | null {
  if (!f.title.trim()) return "Add a name for your event.";
  if (!f.clubName.trim())
    return isExternal ? "Add who runs this event." : "Add the club or society hosting it.";
  if (!f.description.trim()) return "Add details so people know what to expect.";
  if (!f.startDate || !f.endDate) return "Pick a start and end time.";
  if (new Date(f.endDate) <= new Date(f.startDate)) return "The end time has to be after the start time.";
  if (f.registrationDeadline && new Date(f.registrationDeadline) > new Date(f.startDate))
    return "Sign-ups have to close before the event starts.";
  if (f.mode === "OFFLINE" && !f.venue.trim()) return "Add a venue so people know where to go.";
  if (isExternal && !f.meetingUrl.trim()) return "Add the sign-up link from the other site.";
  const isTeam = f.participationType === "TEAM" || f.participationType === "BOTH";
  if (isTeam && Number(f.minTeamSize) > Number(f.maxTeamSize))
    return "The smallest team can't be bigger than the biggest team.";
  return null;
}

export function NewEventClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExternal, setIsExternal] = useState(() => searchParams?.get("type") === "external");
  const [form, setForm] = useState<EventFormState>(INITIAL_FORM);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [submitting, setSubmitting] = useState<"PUBLISHED" | "DRAFT" | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const hydrated = useRef(false);

  const set: SetField = useCallback((key, value) => setForm((prev) => ({ ...prev, [key]: value })), []);

  useEffect(() => {
    try {
      const draft = restoreDraft(localStorage.getItem(DRAFT_KEY));
      if (draft) {
        setForm((prev) => ({ ...prev, ...draft }));
        if (draft.title || draft.description) setDraftRestored(true);
      }
    } catch {
      // Ignore a corrupt or blocked draft.
    } finally {
      hydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      } catch {
        // Storage is best effort.
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form]);

  const checklist: ChecklistItem[] = useMemo(() => {
    const needsVenue = form.mode !== "ONLINE";
    const needsLink = form.mode !== "OFFLINE";
    return [
      { id: "title", label: "Name and club", done: Boolean(form.title.trim() && form.clubName.trim()) },
      { id: "schedule", label: "Start and end time", done: Boolean(form.startDate && form.endDate) },
      {
        id: "location",
        label: "Venue or link",
        done: Boolean((needsVenue && form.venue.trim()) || (needsLink && form.meetingUrl.trim())),
      },
      { id: "banner", label: "Poster", done: Boolean(form.bannerUrl.trim()) },
      { id: "description", label: "Details (50+ characters)", done: form.description.trim().length >= 50 },
      {
        id: "rewards",
        label: "Prizes or perks",
        done: Boolean(form.prizesDescription.trim() || form.perks.length),
      },
    ];
  }, [form]);

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Best effort.
    }
  }

  async function submit(status: "PUBLISHED" | "DRAFT") {
    if (submitting) return;
    const problem = validate(form, isExternal);
    if (problem) {
      toast.error(problem);
      haptics.error();
      return;
    }
    setSubmitting(status);
    haptics.medium();
    const isTeam = form.participationType === "TEAM" || form.participationType === "BOTH";
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          tagline: form.tagline,
          clubName: form.clubName,
          description: form.description,
          bannerUrl: form.bannerUrl.trim() || null,
          eventType: form.eventType,
          mode: form.mode,
          venue: form.venue.trim() || null,
          meetingUrl: form.meetingUrl.trim() || null,
          startDate: form.startDate,
          endDate: form.endDate,
          registrationDeadline: form.registrationDeadline || null,
          participationType: form.participationType,
          minTeamSize: isTeam ? Number(form.minTeamSize) || 1 : 1,
          maxTeamSize: isTeam ? Number(form.maxTeamSize) || 4 : 1,
          maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
          isPaid: form.isPaid,
          entryFee: form.isPaid ? form.entryFee.trim() || "Paid" : "Free",
          eligibleInstitutionIds: isExternal || form.isAllColleges ? ["ALL"] : [],
          prizesDescription: form.prizesDescription.trim() || null,
          perks: form.perks,
          loopPointsReward: Number(form.loopPointsReward) || 30,
          status,
          visibility: form.visibility,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        event?: { slug?: string; id?: string };
      };
      if (!res.ok)
        throw new Error(data.error || "Couldn't save your event. Check your connection and try again.");
      clearDraft();
      sounds.ting();
      toast.success(status === "DRAFT" ? "Draft saved. Publish it when you're ready." : "Event published.");
      mutate("/api/events");
      router.push(`/events/manage/${data.event?.slug || data.event?.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't save your event. Check your connection and try again."
      );
      haptics.error();
    } finally {
      setSubmitting(null);
    }
  }

  const sectionProps = { form, set, isExternal };

  return (
    <div className="min-h-dvh bg-bg pb-24 text-fg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => router.back()}>
              <ArrowLeft aria-hidden="true" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-fg">Host an event</h1>
              {savedAt && <p className="text-xs text-fg-subtle">Draft saved on this device at {savedAt}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link href="/events/dashboard">My events</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="hidden sm:inline-flex"
              disabled={Boolean(submitting)}
              loading={submitting === "DRAFT"}
              onClick={() => submit("DRAFT")}
            >
              Save draft
            </Button>
            <Button
              type="button"
              disabled={Boolean(submitting)}
              loading={submitting === "PUBLISHED"}
              onClick={() => submit("PUBLISHED")}
            >
              Publish
            </Button>
          </div>
        </div>
      </header>

      {draftRestored && (
        <div role="status" className="border-b border-border bg-surface-muted px-4 py-2">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-sm text-fg">
            <span>We brought back your unsaved draft.</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                clearDraft();
                setForm(INITIAL_FORM);
                setDraftRestored(false);
              }}
            >
              Start over
            </Button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 space-y-3">
          <SegmentedControl
            aria-label="Where the event happens"
            fullWidth
            className="sm:w-auto"
            value={isExternal ? "external" : "club"}
            onChange={(v) => {
              setIsExternal(v === "external");
              if (v === "external") set("isAllColleges", true);
            }}
            options={[
              { value: "club", label: "Club event", icon: <Building2 aria-hidden="true" /> },
              { value: "external", label: "On another site", icon: <Globe aria-hidden="true" /> },
            ]}
          />
          <SegmentedControl
            aria-label="Edit or preview"
            fullWidth
            className="lg:hidden"
            value={mobileTab}
            onChange={setMobileTab}
            options={[
              { value: "edit", label: "Edit" },
              { value: "preview", label: "Preview" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submit("PUBLISHED");
            }}
            className={cn("space-y-6 lg:col-span-7", mobileTab === "preview" && "hidden lg:block")}
          >
            <BasicsSection {...sectionProps} />
            <PosterSection {...sectionProps} />
            <WhereSection {...sectionProps} />
            <WhenSection {...sectionProps} />
            <WhoSection {...sectionProps} />
            <PrizesSection {...sectionProps} />
            <DetailsSection {...sectionProps} />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={Boolean(submitting)}
                loading={submitting === "DRAFT"}
                onClick={() => submit("DRAFT")}
              >
                Save draft
              </Button>
              <Button
                type="submit"
                size="lg"
                className="flex-[2]"
                disabled={Boolean(submitting)}
                loading={submitting === "PUBLISHED"}
              >
                Publish event
              </Button>
            </div>
          </form>

          <aside
            className={cn(
              "space-y-8 lg:sticky lg:top-20 lg:col-span-5",
              mobileTab === "edit" && "hidden lg:block"
            )}
          >
            <EventPreview form={form} />
            <ReadinessList items={checklist} />
          </aside>
        </div>
      </div>
    </div>
  );
}
