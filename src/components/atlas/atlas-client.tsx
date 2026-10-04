"use client";

import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Coffee,
  Compass,
  Database,
  ExternalLink,
  HeartPulse,
  Info,
  Layers,
  MapPin,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { ContextualLivingNav } from "@/components/navigation/contextual-living-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AtlasResponse } from "@/lib/atlas/agent";
import { cn } from "@/lib/utils";

interface AtlasClientProps {
  initialSanityConfigured: boolean;
  projectId: string;
  dataset: string;
}

const STUDENT_PROMPTS = [
  {
    label: "Printing & Services",
    prompt: "Where can I print documents on campus?",
    icon: Printer,
  },
  {
    label: "Evening Events",
    prompt: "Which events are happening after 6 PM?",
    icon: Calendar,
  },
  {
    label: "Web Dev Clubs",
    prompt: "Which beginner-friendly events are hosted by clubs that teach web development?",
    icon: Users,
  },
  {
    label: "Freshman Guide",
    prompt: "I am a first-year student, want to learn frontend development, cannot attend before 6 PM, and don't want competitive programming. What can I attend?",
    icon: BookOpen,
  },
  {
    label: "AI Workshops",
    prompt: "Which AI events after 6 PM are beginner-friendly?",
    icon: Sparkles,
  },
];

const CAMPUS_PLACES = [
  {
    id: "library",
    name: "Central Library",
    category: "Buildings",
    status: "Open until 10 PM",
    isOpen: true,
    distance: "250m",
    walkingTime: "3 min walk",
    description: "Multi-floor air conditioned reading halls, Wi-Fi, computer labs, and digital printing kiosk.",
    icon: BookOpen,
    color: "amber",
  },
  {
    id: "sac",
    name: "Student Activity Center (SAC)",
    category: "Clubs",
    status: "Open until 9 PM",
    isOpen: true,
    distance: "400m",
    walkingTime: "5 min walk",
    description: "Hub for tech clubs, cultural societies, robotics club, dance rooms, and debate hall.",
    icon: Users,
    color: "purple",
  },
  {
    id: "canteen",
    name: "Central Food Court & Canteen",
    category: "Food",
    status: "Open until 11 PM",
    isOpen: true,
    distance: "300m",
    walkingTime: "4 min walk",
    description: "Fresh meals, South Indian dosas, tea/coffee counters, night snacks, and seating lounge.",
    icon: Coffee,
    color: "emerald",
  },
  {
    id: "sports",
    name: "Sports Complex & Gymnasium",
    category: "Services",
    status: "Open until 9:30 PM",
    isOpen: true,
    distance: "600m",
    walkingTime: "8 min walk",
    description: "Indoor badminton courts, table tennis, cardio gym, basketball court, and running track.",
    icon: Trophy,
    color: "sky",
  },
  {
    id: "health",
    name: "Campus Health Center",
    category: "Services",
    status: "24/7 Emergency",
    isOpen: true,
    distance: "500m",
    walkingTime: "6 min walk",
    description: "Resident medical officer, first aid, pharmacy counter, basic lab diagnostics, and ambulance.",
    icon: HeartPulse,
    color: "rose",
  },
];

export function AtlasClient({ initialSanityConfigured, projectId, dataset }: AtlasClientProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AtlasResponse | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showDevPanel, setShowDevPanel] = useState(false);

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

  const filteredPlaces =
    activeCategory === "all"
      ? CAMPUS_PLACES
      : CAMPUS_PLACES.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="min-h-screen pb-24">
      <ContextualLivingNav />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Compass className="size-3.5" />
              Campus Directory &amp; Intelligence Agent
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-foreground">
              Campus Atlas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore campus places, open food spots, labs, and ask real-time questions
            </p>
          </div>
        </div>

        {/* Search & AI Question Input */}
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery(prompt);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Atlas about clubs, schedules, freshman eligibility, or campus places..."
                className="h-12 w-full rounded-2xl bg-card pl-12 pr-4 text-sm font-medium border border-border/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="h-12 px-6 rounded-2xl font-bold gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Ask Atlas</span>
                </>
              )}
            </Button>
          </form>

          {/* Quick Student Suggestions */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">Common Student Questions:</span>
            <div className="flex flex-wrap gap-2">
              {STUDENT_PROMPTS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuery(item.prompt)}
                    className="flex items-center gap-1.5 rounded-xl border border-border/40 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary active:scale-95"
                  >
                    <Icon className="size-3.5 text-primary" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Response Display Card */}
        {response ? (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="p-6 space-y-4 border-primary/30 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    Atlas Intelligence
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-xs md:max-w-md">
                    "{response.query}"
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEvidence(!showEvidence)}
                    className="text-xs font-semibold h-8 gap-1.5"
                  >
                    <Info className="size-3.5 text-primary" />
                    <span>{showEvidence ? "Hide Evidence" : "Why this answer?"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGroq(!showGroq)}
                    className="text-xs font-mono h-8 text-muted-foreground"
                  >
                    <Code2 className="size-3.5 mr-1" />
                    GROQ
                  </Button>
                </div>
              </div>

              {/* Answer Summary */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground font-medium">
                {response.summary}
              </div>

              {/* Matched Events Grid */}
              {response.matchedEvents.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    Matching Recommendations ({response.matchedEvents.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {response.matchedEvents.map((event) => (
                      <div
                        key={event._id}
                        className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-foreground">{event.title}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
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
                              {event.venue?.name || "Campus Hall"} ({event.venue?.building || "Main Block"})
                            </span>
                          </div>
                        </div>
                        {event.skills && event.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {event.skills.map((skill: string) => (
                              <span
                                key={skill}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-card border border-border/50 text-foreground font-mono"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Excluded Events Breakdown */}
              {response.excludedEvents.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <XCircle className="size-3.5 text-amber-500" />
                    Excluded Events with Explanations ({response.excludedEvents.length})
                  </h3>
                  <div className="divide-y divide-border/40 rounded-xl border border-border/40 bg-muted/20 text-xs">
                    {response.excludedEvents.map((ex) => (
                      <div key={ex.title} className="p-3 flex items-start gap-2.5">
                        <div className="font-semibold text-foreground shrink-0 w-36 md:w-48 truncate">
                          {ex.title}
                        </div>
                        <div className="text-muted-foreground">{ex.reasons.join("; ")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Inspectable Evidence Drawer */}
              {showEvidence ? (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>Structured Grounding &amp; Provenance</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-semibold text-muted-foreground">Matched Constraints:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {response.evidence.matchedConstraints.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold"
                        >
                          ✓ {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {response.evidence.sources.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <span className="font-semibold text-muted-foreground">Source Documents in Sanity:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {response.evidence.sources.map((src, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl border border-border/50 bg-card flex flex-col justify-between"
                          >
                            <span className="font-bold text-foreground">{src.title}</span>
                            <span className="text-[10px] text-muted-foreground font-mono mt-1">
                              [{src.type}] • {src.detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* GROQ Query View */}
              {showGroq ? (
                <div className="p-3 rounded-xl border border-border/50 bg-neutral-950 text-neutral-100 font-mono text-xs overflow-x-auto">
                  <div className="flex items-center justify-between pb-1 text-neutral-400 font-sans font-semibold">
                    <span>Underlying Sanity GROQ Query:</span>
                  </div>
                  <pre className="p-2 overflow-x-auto text-[11px]">{response.groqQuery}</pre>
                </div>
              ) : null}
            </Card>
          </section>
        ) : null}

        {/* Campus Place Explorer */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Campus Places &amp; Landmarks
              </h2>
              <p className="text-xs text-muted-foreground">
                Verified locations, operating hours, and walking distances
              </p>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(
                [
                  { id: "all", label: "All Places" },
                  { id: "Buildings", label: "Buildings" },
                  { id: "Food", label: "Food" },
                  { id: "Clubs", label: "Clubs" },
                  { id: "Services", label: "Services" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition",
                    activeCategory === cat.id
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaces.map((place) => {
              const Icon = place.icon;
              return (
                <Card
                  key={place.id}
                  className="flex flex-col justify-between p-5 space-y-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <Icon className="size-5" />
                      </div>
                      <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {place.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground">{place.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {place.description}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 font-semibold text-foreground">
                      <MapPin className="size-3.5 text-rose-500" />
                      <span>{place.walkingTime}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuery(`What can I do at ${place.name}?`)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Ask Atlas →
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Collapsible Developer & Debug Drawer */}
        <section className="border-t border-border/40 pt-6">
          <button
            type="button"
            onClick={() => setShowDevPanel(!showDevPanel)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("size-3.5 transition-transform", showDevPanel && "rotate-180")} />
            <span>Developer &amp; Sanity Lake Architecture</span>
          </button>

          {showDevPanel ? (
            <div className="mt-4 rounded-2xl border border-border/40 bg-card p-5 space-y-3 text-xs text-muted-foreground animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="size-4 text-primary" />
                  <span className="font-bold text-foreground">Sanity Content Lake Connector</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>
                    Project: <code className="font-mono text-primary">{projectId}</code>
                  </span>
                  <span>•</span>
                  <span>
                    Dataset: <code className="font-mono text-foreground">{dataset}</code>
                  </span>
                </div>
              </div>

              <p className="leading-relaxed">
                CampusLoop Atlas is an intelligent agent architecture that queries structured schemas in
                Sanity Content Lake using GROQ expressions, resolving complex multi-constraint questions without
                hallucinating event times or club locations.
              </p>

              <div className="flex items-center gap-4 pt-1 text-primary">
                <a
                  href="https://dev.to/sh20raj/campusloop-atlas-i-built-an-agent-that-knows-what-is-actually-happening-on-campus-1iai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  Architecture Article <ExternalLink className="size-3" />
                </a>
                <a
                  href="/api/atlas/session"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  Agent Session Endpoint <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
