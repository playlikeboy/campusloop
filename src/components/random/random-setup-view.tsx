"use client";

import {
  ArrowLeft,
  BookOpen,
  Brain,
  Code2,
  Film,
  Gamepad2,
  Globe,
  Heart,
  Moon,
  Music,
  Rocket,
  School,
  ShieldCheck,
  Shuffle,
  Smile,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

export type RandomMode = "MY_CAMPUS" | "ANY_CAMPUS";

export const MAX_INTERESTS = 3;

const INTERESTS = [
  { id: "fun", label: "Just chat", icon: Smile },
  { id: "tech", label: "Tech", icon: Code2 },
  { id: "study", label: "Study and exams", icon: BookOpen },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "music", label: "Music", icon: Music },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "movies", label: "Movies and anime", icon: Film },
  { id: "startups", label: "Startups", icon: Rocket },
  { id: "relationships", label: "Relationships", icon: Heart },
  { id: "latenight", label: "Late-night talks", icon: Moon },
  { id: "life", label: "Life and career", icon: Brain },
  { id: "surprise", label: "Anything", icon: Shuffle },
];

const MODES: { id: RandomMode; icon: typeof School; title: string; description: string }[] = [
  { id: "MY_CAMPUS", icon: School, title: "My college", description: "Someone from your college" },
  { id: "ANY_CAMPUS", icon: Globe, title: "Any college", description: "Someone from anywhere in India" },
];

interface RandomSetupViewProps {
  mode: RandomMode;
  onModeChange: (mode: RandomMode) => void;
  interests: string[];
  onToggleInterest: (id: string) => void;
  onFind: () => void;
  onShowSafety: () => void;
}

export function RandomSetupView({
  mode,
  onModeChange,
  interests,
  onToggleInterest,
  onFind,
  onShowSafety,
}: RandomSetupViewProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? INTERESTS : INTERESTS.filter((chip, i) => i < 6 || interests.includes(chip.id));

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-4 pb-24">
      <header className="flex items-start gap-2">
        <Link
          href="/more"
          aria-label="Back"
          className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="flex items-center gap-2 text-2xl">
            Random
            <Badge variant="outline">Beta</Badge>
          </h1>
          <p className="mt-1 text-sm text-fg-muted">Chat with a student you don't know. Names stay hidden.</p>
        </div>
      </header>

      <section className="mt-6 space-y-3" aria-labelledby="random-who">
        <h2 id="random-who" className="text-lg">
          Who do you want to meet?
        </h2>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="random-who">
          {MODES.map((m) => {
            const selected = mode === m.id;
            const Icon = m.icon;
            return (
              // biome-ignore lint/a11y/useSemanticElements: styled radio tile
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onModeChange(m.id)}
                className={cn(
                  "cl-interactive min-h-24 cursor-pointer rounded-lg border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-brand bg-brand-subtle"
                    : "border-border bg-surface hover:bg-surface-muted"
                )}
              >
                <Icon className={cn("size-5", selected ? "text-brand-text" : "text-fg-muted")} aria-hidden />
                <p className="mt-2 text-sm font-semibold text-fg">{m.title}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{m.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 space-y-3" aria-labelledby="random-topics">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="random-topics" className="text-lg">
            What do you want to talk about?
          </h2>
          <span className="shrink-0 text-sm tabular-nums text-fg-muted">
            {interests.length}/{MAX_INTERESTS}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {visible.map((chip) => {
            const Icon = chip.icon;
            return (
              <Chip
                key={chip.id}
                selected={interests.includes(chip.id)}
                onClick={() => onToggleInterest(chip.id)}
                icon={<Icon className="size-4" />}
              >
                {chip.label}
              </Chip>
            );
          })}
        </div>
        <Button variant="link" className="px-0" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer topics" : "Show more topics"}
        </Button>
      </section>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 mt-6 border-t border-border bg-bg px-4 pt-3 lg:bottom-0">
        <div className="flex flex-col gap-1">
          <Button size="lg" className="w-full" onClick={onFind} disabled={interests.length === 0}>
            Find someone
          </Button>
          <button
            type="button"
            onClick={onShowSafety}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 text-sm text-fg-muted transition-ui hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ShieldCheck className="size-4" aria-hidden />
            How we keep it safe
          </button>
        </div>
      </div>
    </main>
  );
}
