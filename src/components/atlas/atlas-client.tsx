"use client";

import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ContextualLivingNav } from "@/components/navigation/contextual-living-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { QuestionSticker } from "@/components/ui/stickers";
import type { AtlasResponse } from "@/lib/atlas/agent";

const STUDENT_PROMPTS = [
  { label: "Upcoming events", prompt: "What events are coming up on campus?", icon: CalendarDays },
  { label: "Find a club", prompt: "List the clubs in the campus directory.", icon: Users },
  {
    label: "Beginner tech events",
    prompt: "Which beginner-friendly events cover web development?",
    icon: BookOpen,
  },
  { label: "After 6 PM", prompt: "Which events start after 6 PM?", icon: Clock },
];

type AtlasApiResponse = {
  success?: boolean;
  error?: string;
  sanityConnected?: boolean;
  result?: AtlasResponse;
};

function formatEventDate(value: unknown) {
  if (!value || typeof value !== "string") return "Schedule not listed";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Schedule not listed";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AtlasClient() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AtlasResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<"configured" | "preview" | null>(null);

  async function handleQuery(queryText: string) {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || loading) return;

    setPrompt(cleanQuery);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/atlas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanQuery }),
      });
      const data = (await res.json().catch(() => ({}))) as AtlasApiResponse;

      if (!res.ok || !data.success || !data.result) {
        throw new Error(data.error || "Try asking in a different way.");
      }

      setResponse(data.result);
      setSourceMode(data.sanityConnected ? "configured" : "preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Atlas is down right now. Try again in a minute.");
    } finally {
      setLoading(false);
    }
  }

  const matchedEvents = response?.matchedEvents ?? [];
  const matchedClubs = response?.matchedClubs ?? [];
  const evidenceSources = response?.evidence?.sources ?? [];

  return (
    <div className="min-h-screen pb-24">
      <ContextualLivingNav />

      <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-fg">Campus Atlas</h1>
          <p className="max-w-prose text-sm text-fg-muted">
            Ask about clubs, events and timings. Every answer shows where it came from.
          </p>
        </header>

        <QuestionSticker
          prompt="Ask about your campus"
          value={prompt}
          onChange={setPrompt}
          onSubmit={(value) => void handleQuery(value)}
          placeholder="Which beginner events start after 6 PM?"
          submitLabel="Ask"
          maxLength={500}
          loading={loading}
          className="max-w-2xl"
        />

        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Try one of these</legend>
          {STUDENT_PROMPTS.map(({ label, prompt: suggestedPrompt, icon: Icon }) => (
            <Chip
              key={label}
              size="sm"
              icon={<Icon aria-hidden="true" />}
              disabled={loading}
              onClick={() => void handleQuery(suggestedPrompt)}
            >
              {label}
            </Chip>
          ))}
        </fieldset>

        {error ? (
          <div role="alert" className="flex items-start gap-3 rounded-lg bg-danger-subtle p-4 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-fg">Atlas couldn't answer that</p>
              <p className="mt-1 text-fg-muted">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => void handleQuery(prompt)}>
                Try again
              </Button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div
            className="flex min-h-36 items-center justify-center gap-3 rounded-lg border border-border bg-surface text-sm text-fg-muted"
            role="status"
            aria-live="polite"
          >
            <Spinner size="md" />
            Looking through campus records
          </div>
        ) : null}

        {response && !loading ? (
          <section className="space-y-4" aria-labelledby="atlas-results-heading">
            <div className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 id="atlas-results-heading" className="text-xl font-bold text-fg">
                  What Atlas found
                </h2>
                <p className="mt-1 truncate text-xs text-muted-foreground" title={response.query}>
                  “{response.query}”
                </p>
              </div>
              <Badge variant={sourceMode === "preview" ? "warning" : "verified"}>
                {sourceMode === "preview" ? "Sample data, double-check details" : "From live campus records"}
              </Badge>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
              <p className="max-w-prose whitespace-pre-wrap text-sm leading-7 text-fg">{response.summary}</p>
            </div>

            {matchedEvents.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-2">
                  <h3 className="text-base font-bold tracking-tight text-foreground">Matching events</h3>
                  <span className="text-xs font-medium text-muted-foreground">
                    {matchedEvents.length} found
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {matchedEvents.map((event: any, index: number) => (
                    <article
                      key={event._id || event.id || event.title || index}
                      className="rounded-lg border border-border bg-surface p-4"
                    >
                      <h4 className="font-bold leading-snug text-foreground">
                        {event.title || "Campus event"}
                      </h4>
                      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                        <p className="flex items-start gap-2">
                          <CalendarDays
                            className="mt-0.5 size-3.5 shrink-0 text-fg-subtle"
                            aria-hidden="true"
                          />
                          <span>{formatEventDate(event.startAt)}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <Users className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                          <span>{event.organizer?.name || "Organizer not listed"}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                          <span>
                            {[event.venue?.name, event.venue?.building].filter(Boolean).join(" · ") ||
                              "Venue not listed"}
                          </span>
                        </p>
                      </div>
                      {Array.isArray(event.skills) && event.skills.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {event.skills.slice(0, 5).map((skill: string) => (
                            <span
                              key={skill}
                              className="rounded-md bg-muted/70 px-2 py-1 text-xs font-semibold text-muted-foreground"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {matchedClubs.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-base font-bold tracking-tight text-foreground">Related clubs</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {matchedClubs.map((club: any, index: number) => (
                    <article
                      key={club._id || club.id || club.name || index}
                      className="rounded-lg border border-border bg-surface p-4"
                    >
                      <h4 className="font-bold text-fg">{club.name || "Campus club"}</h4>
                      {club.description ? (
                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                          {club.description}
                        </p>
                      ) : null}
                      {Array.isArray(club.skills) && club.skills.length > 0 ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {club.skills.slice(0, 5).join(" · ")}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {matchedEvents.length === 0 && matchedClubs.length === 0 ? (
              <EmptyState
                icon={Search}
                size="compact"
                bordered
                title="Nothing matched"
                description="Try a broader topic or fewer details."
              />
            ) : null}

            {response.excludedEvents?.length > 0 ? (
              <details className="group rounded-lg border border-border bg-surface">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span>Why some events didn’t match ({response.excludedEvents.length})</span>
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="divide-y divide-border/60 border-t border-border/60">
                  {response.excludedEvents.slice(0, 10).map((item, index) => (
                    <div key={item.title + index} className="px-4 py-3">
                      <p className="text-xs font-bold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {item.reasons.join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}

            {evidenceSources.length > 0 ? (
              <details className="group rounded-lg border border-border bg-surface">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-fg-subtle" aria-hidden="true" />
                    Sources and evidence ({evidenceSources.length})
                  </span>
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="grid gap-2 border-t border-border/60 p-3 sm:grid-cols-2">
                  {evidenceSources.slice(0, 12).map((source, index) => (
                    <div key={source.id + index} className="rounded-md bg-surface-muted p-3">
                      <p className="text-xs font-bold text-foreground">{source.title}</p>
                      <p className="mt-1 text-xs font-semibold text-brand-text">{source.type}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{source.detail}</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
