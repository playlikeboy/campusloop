"use client";

import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Compass,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ContextualLivingNav } from "@/components/navigation/contextual-living-nav";
import { cn } from "@/lib/utils";
import type { AtlasResponse } from "@/lib/atlas/agent";

const STUDENT_PROMPTS = [
  { label: "Upcoming events", prompt: "What events are coming up on campus?", icon: CalendarDays },
  { label: "Find a club", prompt: "List the clubs in the campus directory.", icon: Users },
  { label: "Beginner-friendly tech", prompt: "Which beginner-friendly events cover web development?", icon: BookOpen },
  { label: "After 6 PM", prompt: "Which events start after 6 PM?", icon: Compass },
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
        throw new Error(data.error || "Atlas couldn't answer that. Please try again.");
      }

      setResponse(data.result);
      setSourceMode(data.sanityConnected ? "configured" : "preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Atlas is temporarily unavailable. Please try again.");
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

      <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-5 sm:px-6 sm:py-8">
        <section className="relative isolate overflow-hidden rounded-[28px] bg-[var(--surface)] p-5 shadow-sm ring-1 ring-border/70 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-primary/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 -z-10 size-64 rounded-full bg-coral/15 blur-3xl" />

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Campus intelligence
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              Your campus, easier to navigate.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Ask about clubs, upcoming events, schedules, and eligibility. Atlas surfaces matching campus records and shows where its answers come from.
            </p>
          </div>

          <form
            className="mt-6 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void handleQuery(prompt);
            }}
          >
            <label htmlFor="atlas-prompt" className="sr-only">Ask Campus Atlas</label>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="atlas-prompt"
                type="search"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Try “Which beginner-friendly events start after 6 PM?”"
                maxLength={500}
                autoComplete="off"
                className="h-12 w-full rounded-2xl border border-border/70 bg-background/90 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
              {loading ? "Searching records…" : "Ask Atlas"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {STUDENT_PROMPTS.map(({ label, prompt: suggestedPrompt, icon: Icon }) => (
              <button
                key={label}
                type="button"
                disabled={loading}
                onClick={() => void handleQuery(suggestedPrompt)}
                className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border/70 bg-background/75 px-3 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Icon className="size-3.5 text-primary" aria-hidden="true" />
                {label}
                <ArrowUpRight className="size-3 text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Atlas couldn’t complete that search</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={() => void handleQuery(prompt)}
                className="mt-3 min-h-9 rounded-xl bg-background px-3 text-xs font-bold text-foreground ring-1 ring-border transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {!response && !loading && !error ? (
          <section className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
            <div className="rounded-[24px] bg-card p-5 ring-1 ring-border/60 sm:p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Compass className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-black tracking-tight text-foreground">Start with a question</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Make your question specific. Include a topic, a time, or who an event should be suitable for to narrow the results.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                <span className="rounded-lg bg-muted/70 px-2.5 py-1.5">Events & schedules</span>
                <span className="rounded-lg bg-muted/70 px-2.5 py-1.5">Clubs & skills</span>
                <span className="rounded-lg bg-muted/70 px-2.5 py-1.5">Eligibility</span>
              </div>
            </div>
            <div className="rounded-[24px] bg-card p-5 ring-1 ring-border/60 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                Grounded answers
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Results are based on the campus events, clubs, and announcements available to Atlas—not a made-up map or assumed opening hours. Check the listed source details when timing matters.
              </p>
            </div>
          </section>
        ) : null}

        {loading ? (
          <div className="flex min-h-36 items-center justify-center gap-3 rounded-[24px] bg-card text-sm font-medium text-muted-foreground ring-1 ring-border/60" role="status" aria-live="polite">
            <span className="size-5 animate-spin rounded-full border-2 border-primary border-r-transparent" aria-hidden="true" />
            Searching campus records…
          </div>
        ) : null}

        {response && !loading ? (
          <section className="space-y-4" aria-labelledby="atlas-results-heading">
            <div className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Search results</p>
                <h2 id="atlas-results-heading" className="mt-1 text-xl font-black tracking-tight text-foreground">Here’s what Atlas found</h2>
                <p className="mt-1 truncate text-xs text-muted-foreground" title={response.query}>“{response.query}”</p>
              </div>
              <span className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold",
                sourceMode === "preview" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              )}>
                <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                {sourceMode === "preview" ? "Preview data · verify details" : "Live source configured"}
              </span>
            </div>

            <div className="rounded-[24px] bg-card p-5 ring-1 ring-border/60 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                Summary
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">{response.summary}</p>
            </div>

            {matchedEvents.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-2">
                  <h3 className="text-base font-black tracking-tight text-foreground">Matching events</h3>
                  <span className="text-xs font-medium text-muted-foreground">{matchedEvents.length} found</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {matchedEvents.map((event: any, index: number) => (
                    <article key={event._id || event.id || event.title || index} className="rounded-[20px] bg-card p-4 ring-1 ring-border/60">
                      <h4 className="font-bold leading-snug text-foreground">{event.title || "Campus event"}</h4>
                      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                        <p className="flex items-start gap-2">
                          <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                          <span>{formatEventDate(event.startAt)}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <Users className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                          <span>{event.organizer?.name || "Organizer not listed"}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                          <span>{[event.venue?.name, event.venue?.building].filter(Boolean).join(" · ") || "Venue not listed"}</span>
                        </p>
                      </div>
                      {Array.isArray(event.skills) && event.skills.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {event.skills.slice(0, 5).map((skill: string) => (
                            <span key={skill} className="rounded-md bg-muted/70 px-2 py-1 text-[10px] font-semibold text-muted-foreground">{skill}</span>
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
                <h3 className="text-base font-black tracking-tight text-foreground">Related clubs</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {matchedClubs.map((club: any, index: number) => (
                    <article key={club._id || club.id || club.name || index} className="rounded-[20px] bg-card p-4 ring-1 ring-border/60">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Users className="size-4" aria-hidden="true" />
                      </div>
                      <h4 className="mt-3 font-bold text-foreground">{club.name || "Campus club"}</h4>
                      {club.description ? <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{club.description}</p> : null}
                      {Array.isArray(club.skills) && club.skills.length > 0 ? (
                        <p className="mt-3 text-xs text-muted-foreground">{club.skills.slice(0, 5).join(" · ")}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {matchedEvents.length === 0 && matchedClubs.length === 0 ? (
              <div className="rounded-[24px] bg-card px-5 py-10 text-center ring-1 ring-border/60">
                <Search className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-3 font-bold text-foreground">No matching records yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try a broader topic, or remove one of your filters.</p>
              </div>
            ) : null}

            {response.excludedEvents?.length > 0 ? (
              <details className="group rounded-[20px] bg-card ring-1 ring-border/60">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  <span>Why some events didn’t match ({response.excludedEvents.length})</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="divide-y divide-border/60 border-t border-border/60">
                  {response.excludedEvents.slice(0, 10).map((item, index) => (
                    <div key={item.title + index} className="px-4 py-3">
                      <p className="text-xs font-bold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.reasons.join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}

            {evidenceSources.length > 0 ? (
              <details className="group rounded-[20px] bg-card ring-1 ring-border/60">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                    Sources and evidence ({evidenceSources.length})
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="grid gap-2 border-t border-border/60 p-3 sm:grid-cols-2">
                  {evidenceSources.slice(0, 12).map((source, index) => (
                    <div key={source.id + index} className="rounded-xl bg-muted/40 p-3">
                      <p className="text-xs font-bold text-foreground">{source.title}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{source.type}</p>
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
