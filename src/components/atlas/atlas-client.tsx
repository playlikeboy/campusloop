"use client";

import { useState } from "react";
import {
  Compass,
  Sparkles,
  Database,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Layers,
  Info,
} from "lucide-react";
import type { AtlasResponse } from "@/lib/atlas/agent";

interface AtlasClientProps {
  initialSanityConfigured: boolean;
  projectId: string;
  dataset: string;
}

const PRESET_QUERIES = [
  {
    level: 1,
    label: "Level 1: Campus Directory",
    prompt: "What clubs exist?",
  },
  {
    level: 2,
    label: "Level 2: Time Filter",
    prompt: "Which events are happening after 6 PM?",
  },
  {
    level: 3,
    label: "Level 3: Multi-Constraint",
    prompt: "Which AI events after 6 PM are beginner-friendly?",
  },
  {
    level: 4,
    label: "Level 4: Relationship Reasoning",
    prompt: "Which beginner-friendly events are hosted by clubs that teach web development?",
  },
  {
    level: 5,
    label: "Level 5: Ambiguity & Constraints",
    prompt:
      "I am a first-year student, want to learn frontend development, cannot attend before 6 PM, and don't want competitive programming. What can I attend?",
  },
  {
    level: 6,
    label: "Level 6: Provenance & Conflict",
    prompt: "Why does one source say 5 PM and another say 6 PM?",
  },
];

export function AtlasClient({
  initialSanityConfigured,
  projectId,
  dataset,
}: AtlasClientProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AtlasResponse | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showGroq, setShowGroq] = useState(false);

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;
    setLoading(true);
    setPrompt(queryText);

    try {
      const res = await fetch("/api/atlas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: queryText }),
      });
      const data = (await res.json()) as any;
      if (data?.success && data?.result) {
        setResponse(data.result);
      }
    } catch (err) {
      console.error("Atlas query failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 md:p-8 backdrop-blur-md shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Compass className="size-3.5" />
                Sanity Challenge Entry
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/50">
                <Database className="size-3.5" />
                {initialSanityConfigured ? "Sanity Live" : "Sanity Content Lake"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              CampusLoop Atlas
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              An agent that answers complex questions about clubs, events, eligibility,
              and schedules by reasoning over structured Sanity content rather than plain text search.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end text-xs text-muted-foreground border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 md:pl-6 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span>Project ID: <code className="font-mono text-primary">{projectId}</code></span>
            </div>
            <div>Dataset: <span className="font-mono text-foreground">{dataset}</span></div>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://dev.to/sh20raj/campusloop-atlas-i-built-an-agent-that-knows-what-is-actually-happening-on-campus-1iai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Submission Post <ExternalLink className="size-3" />
              </a>
              <span className="text-border">•</span>
              <a
                href="/api/atlas/session"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Agent Session <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Evaluation Prompts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="size-3.5" />
            Evaluation Benchmark Matrix (Levels 1 - 6)
          </h2>
          <span className="text-xs text-muted-foreground">Click any level to evaluate</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset.level}
              type="button"
              onClick={() => handleQuery(preset.prompt)}
              className="text-left p-3 rounded-xl border border-border/40 bg-card/40 hover:bg-card hover:border-primary/40 transition-all text-xs space-y-1 group"
            >
              <div className="font-semibold text-primary flex items-center justify-between">
                <span>{preset.label}</span>
                <ChevronRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                "{preset.prompt}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Query Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleQuery(prompt);
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Atlas about clubs, schedules, freshman eligibility, or events..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-card/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              <span>Reasoning...</span>
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              <span>Ask Atlas</span>
            </>
          )}
        </button>
      </form>

      {/* Results View */}
      {response && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-2xl border border-border/50 bg-card/80 p-6 space-y-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  Level {response.level} Result
                </span>
                <span className="text-xs text-muted-foreground font-mono truncate max-w-xs md:max-w-md">
                  "{response.query}"
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <Info className="size-3.5 text-primary" />
                  <span>{showEvidence ? "Hide Evidence" : '🔍 "Why this answer?"'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGroq(!showGroq)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 bg-card hover:bg-muted text-muted-foreground flex items-center gap-1.5 transition-colors font-mono"
                >
                  <Code2 className="size-3.5" />
                  <span>GROQ</span>
                </button>
              </div>
            </div>

            {/* Answer Summary */}
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {response.summary}
            </div>

            {/* Matched Events Grid */}
            {response.matchedEvents.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Matching Recommendations ({response.matchedEvents.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {response.matchedEvents.map((event) => (
                    <div
                      key={event._id}
                      className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm text-foreground">
                          {event.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                          {event.status || "Open"}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 shrink-0" />
                          <span>
                            {new Date(event.startAt).toLocaleString([], {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="size-3.5 shrink-0" />
                          <span>{event.organizer?.name || "Campus Club"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          <span>
                            {event.venue?.name || "Campus Hall"} (
                            {event.venue?.building || "Main Block"})
                          </span>
                        </div>
                      </div>
                      {event.skills && event.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {event.skills.map((skill: string) => (
                            <span
                              key={skill}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border/50 text-foreground font-mono"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Excluded Events Breakdown */}
            {response.excludedEvents.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <XCircle className="size-3.5 text-amber-500" />
                  Excluded Events with Explanations ({response.excludedEvents.length})
                </h3>
                <div className="divide-y divide-border/40 rounded-xl border border-border/40 bg-muted/20 text-xs">
                  {response.excludedEvents.map((ex) => (
                    <div key={ex.title} className="p-3 flex items-start gap-2.5">
                      <div className="font-medium text-foreground shrink-0 w-36 md:w-48 truncate">
                        {ex.title}
                      </div>
                      <div className="text-muted-foreground">
                        {ex.reasons.join("; ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inspectable Evidence Drawer */}
            {showEvidence && (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 text-xs animate-in fade-in duration-200">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>Inspectable Grounding & Evidence (Sanity Context Provenance)</span>
                </div>

                <div className="space-y-1.5">
                  <span className="font-medium text-muted-foreground">Matched Constraints:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {response.evidence.matchedConstraints.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>

                {response.evidence.conflicts && response.evidence.conflicts.length > 0 && (
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-2">
                    <div className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="size-4" />
                      <span>{response.evidence.conflicts[0].issue}</span>
                    </div>
                    <div className="space-y-1 text-muted-foreground">
                      <div>
                        <strong>Claim A:</strong> {response.evidence.conflicts[0].claimA.claim}
                      </div>
                      <div>
                        <strong>Claim B:</strong> {response.evidence.conflicts[0].claimB.claim}
                      </div>
                      <div className="text-foreground pt-1">
                        <strong>Resolution:</strong> {response.evidence.conflicts[0].resolution}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <span className="font-medium text-muted-foreground">Source Documents in Sanity:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {response.evidence.sources.map((src, i) => (
                      <div
                        key={i}
                        className="p-2 rounded border border-border/50 bg-card/60 flex flex-col justify-between"
                      >
                        <span className="font-medium text-foreground">{src.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          [{src.type}] • {src.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* GROQ Query View */}
            {showGroq && (
              <div className="p-3 rounded-xl border border-border/50 bg-neutral-950 text-neutral-100 font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between pb-1 text-neutral-400">
                  <span>Underlying Sanity GROQ Query:</span>
                </div>
                <pre>{response.groqQuery}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
