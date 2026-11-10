"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  Lightbulb,
  Minus,
  Plus,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { evaluateFormula } from "@/lib/articles/safe-formula";
import type {
  CalculatorBlock,
  CalloutBlock,
  ComparisonBlock,
  FaqBlock,
  QuizBlock,
  StatsBlock,
  StepsBlock,
  TimelineBlock,
} from "@/lib/articles/smart-blocks";
import { cn } from "@/lib/utils";
import { BlockFrame } from "./block-frame";

export function ComparisonView({ block, raw }: { block: ComparisonBlock; raw: string }) {
  return (
    <BlockFrame title={block.title} raw={raw} type="comparison">
      <div
        className={cn(
          "grid gap-3",
          block.options.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {block.options.map((o) => (
          <div key={o.name} className="rounded-md bg-surface-muted p-4">
            <p className="font-bold text-fg">{o.name}</p>
            {o.summary && <p className="mt-1 text-sm leading-relaxed text-fg-muted">{o.summary}</p>}
            {o.pros.length > 0 && (
              <ul className="mt-3 space-y-1.5" aria-label={`${o.name} strengths`}>
                {o.pros.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-fg">
                    <Plus className="mt-0.5 size-4 shrink-0 text-verified-text" aria-label="Pro" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
            {o.cons.length > 0 && (
              <ul className="mt-2 space-y-1.5" aria-label={`${o.name} weaknesses`}>
                {o.cons.map((c) => (
                  <li key={c} className="flex gap-2 text-sm text-fg">
                    <Minus className="mt-0.5 size-4 shrink-0 text-danger" aria-label="Con" />
                    {c}
                  </li>
                ))}
              </ul>
            )}
            {o.bestFor && (
              <p className="mt-3 rounded-lg bg-brand-subtle px-2.5 py-1.5 text-xs font-semibold text-brand-text">
                Best for: {o.bestFor}
              </p>
            )}
          </div>
        ))}
      </div>
      {block.verdict && (
        <p className="mt-3 text-sm leading-relaxed text-fg">
          <span className="font-semibold">Verdict: </span>
          {block.verdict}
        </p>
      )}
    </BlockFrame>
  );
}

export function TimelineView({ block, raw }: { block: TimelineBlock; raw: string }) {
  return (
    <BlockFrame title={block.title} raw={raw} type="timeline">
      <ol className="relative ml-2 border-l border-border pl-5">
        {block.items.map((it, i) => (
          <li key={`${it.when}-${i}`} className="relative pb-5 last:pb-0">
            <span
              className="absolute -left-[27px] top-1 size-3 rounded-full bg-brand ring-4 ring-surface"
              aria-hidden
            />
            <p className="text-xs font-semibold text-brand-text">{it.when}</p>
            <p className="font-semibold text-fg">{it.title}</p>
            {it.detail && <p className="mt-0.5 text-sm leading-relaxed text-fg-muted">{it.detail}</p>}
          </li>
        ))}
      </ol>
    </BlockFrame>
  );
}

export function StepsView({ block, raw }: { block: StepsBlock; raw: string }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const progress = Math.round((done.size / block.steps.length) * 100);
  return (
    <BlockFrame title={block.title} raw={raw} type="steps">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-brand transition-ui" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs font-semibold tabular-nums text-fg-muted">
          {done.size}/{block.steps.length}
        </span>
      </div>
      <ol className="space-y-1">
        {block.steps.map((s, i) => {
          const checked = done.has(i);
          return (
            <li key={`${i}-${s}`}>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-surface-muted">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setDone((prev) => {
                      const n = new Set(prev);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    })
                  }
                  className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
                />
                <span
                  className={cn(
                    "text-base leading-relaxed",
                    checked ? "text-fg-muted line-through" : "text-fg"
                  )}
                >
                  <span className="mr-1.5 font-semibold text-brand-text">{i + 1}.</span>
                  {s}
                </span>
              </label>
            </li>
          );
        })}
      </ol>
    </BlockFrame>
  );
}

const TONES = {
  info: { icon: Info, cls: "bg-brand-subtle text-brand-text", label: "Note" },
  tip: { icon: Lightbulb, cls: "bg-brand-subtle text-brand-text", label: "Tip" },
  warning: { icon: AlertTriangle, cls: "bg-warning-subtle text-warning", label: "Warning" },
  success: { icon: CheckCircle2, cls: "bg-success-subtle text-verified-text", label: "Good to know" },
} as const;

export function CalloutView({ block }: { block: CalloutBlock }) {
  const t = TONES[block.tone];
  const Icon = t.icon;
  return (
    <aside className={cn("not-prose my-6 flex gap-3 rounded-lg p-4", t.cls)} role="note">
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-bold">{block.title ?? t.label}</p>
        <p className="mt-0.5 whitespace-pre-line text-base leading-relaxed text-fg">{block.text}</p>
      </div>
    </aside>
  );
}

export function StatsView({ block, raw }: { block: StatsBlock; raw: string }) {
  return (
    <BlockFrame title={block.title} source={block.source} raw={raw} type="stats">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {block.items.map((it) => (
          <div key={it.label} className="rounded-md bg-surface-muted p-3">
            <dd className="text-2xl font-bold tabular-nums tracking-tight text-fg">{it.value}</dd>
            <dt className="mt-0.5 text-sm font-medium text-fg">{it.label}</dt>
            {it.hint && <p className="mt-0.5 text-xs text-fg-muted">{it.hint}</p>}
          </div>
        ))}
      </dl>
    </BlockFrame>
  );
}

export function CalculatorView({ block, raw }: { block: CalculatorBlock; raw: string }) {
  const initial = useMemo(
    () => Object.fromEntries(block.inputs.map((i) => [i.id, i.default])),
    [block.inputs]
  );
  const [vals, setVals] = useState<Record<string, number>>(initial);
  const uid = useId();
  return (
    <BlockFrame
      title={block.title}
      raw={raw}
      type="calculator"
      actions={
        <button
          type="button"
          onClick={() => setVals(initial)}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          aria-label="Reset calculator"
        >
          <RotateCcw className="size-4" />
        </button>
      }
    >
      <div className="grid gap-5 sm:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          {block.inputs.map((inp) => {
            const id = `${uid}-${inp.id}`;
            const hasRange = inp.min !== undefined && inp.max !== undefined;
            return (
              <div key={inp.id}>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={id} className="text-sm font-medium text-fg">
                    {inp.label}
                  </label>
                  <input
                    type="number"
                    value={Number.isFinite(vals[inp.id]) ? vals[inp.id] : ""}
                    min={inp.min}
                    max={inp.max}
                    step={inp.step}
                    onChange={(e) =>
                      setVals((v) => ({ ...v, [inp.id]: e.target.value === "" ? 0 : Number(e.target.value) }))
                    }
                    className="h-9 w-28 rounded-lg bg-bg px-2 text-right text-sm tabular-nums text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${inp.label}${inp.unit ? ` in ${inp.unit}` : ""}`}
                  />
                </div>
                {hasRange && (
                  <input
                    id={id}
                    type="range"
                    min={inp.min}
                    max={inp.max}
                    step={inp.step ?? 1}
                    value={vals[inp.id]}
                    onChange={(e) => setVals((v) => ({ ...v, [inp.id]: Number(e.target.value) }))}
                    className="mt-2 w-full accent-[var(--primary)]"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="space-y-2 rounded-md bg-brand-subtle p-4" aria-live="polite">
          {block.outputs.map((o) => {
            let text: string;
            try {
              const v = evaluateFormula(o.formula, vals);
              text = Number.isFinite(v)
                ? `${o.unit === "₹" ? "₹" : ""}${v.toLocaleString("en-IN", { maximumFractionDigits: o.decimals ?? 2, minimumFractionDigits: 0 })}${o.unit && o.unit !== "₹" ? ` ${o.unit}` : ""}`
                : "Not a number";
            } catch {
              text = "Check the formula";
            }
            return (
              <div key={o.label}>
                <p className="text-xs font-semibold text-brand-text">{o.label}</p>
                <p className="text-2xl font-bold tabular-nums text-fg">{text}</p>
              </div>
            );
          })}
        </div>
      </div>
      {block.note && <p className="mt-3 text-xs text-fg-muted">{block.note}</p>}
    </BlockFrame>
  );
}

export function QuizView({ block, raw }: { block: QuizBlock; raw: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <BlockFrame title="Quick check" raw={raw} type="quiz">
      <p className="font-semibold text-fg">{block.question}</p>
      <div className="mt-3 grid gap-2" role="radiogroup" aria-label={block.question}>
        {block.options.map((o, i) => {
          const correct = i === block.answer;
          const state = !answered ? "idle" : correct ? "correct" : picked === i ? "wrong" : "idle";
          return (
            // biome-ignore lint/a11y/useSemanticElements: option button also shows right/wrong state after answering
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={picked === i}
              disabled={answered}
              onClick={() => setPicked(i)}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                state === "correct" && "bg-success-subtle text-verified-text",
                state === "wrong" && "bg-danger-subtle text-danger",
                state === "idle" && "bg-bg text-fg enabled:hover:bg-surface-muted enabled:cursor-pointer"
              )}
            >
              {state === "correct" && <CheckCircle2 className="size-4 shrink-0" aria-hidden />}
              {state === "wrong" && <XCircle className="size-4 shrink-0" aria-hidden />}
              {o}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3 flex items-start justify-between gap-3">
          <p className="text-sm leading-relaxed text-fg-muted" aria-live="polite">
            <span className="font-semibold text-fg">
              {picked === block.answer ? "Correct. " : "Not quite. "}
            </span>
            {block.explanation}
          </p>
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="shrink-0 text-xs font-semibold text-brand-text hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}
    </BlockFrame>
  );
}

export function FaqView({ block, raw }: { block: FaqBlock; raw: string }) {
  return (
    <BlockFrame title={block.title ?? "Questions"} raw={raw} type="faq">
      <div className="divide-y divide-border">
        {block.items.map((it) => (
          <details key={it.q} className="group py-1">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-1 font-semibold text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {it.q}
              <ChevronDown
                className="size-4 shrink-0 text-fg-muted transition-ui group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-1 pb-3 text-base leading-relaxed text-fg-muted">{it.a}</p>
          </details>
        ))}
      </div>
    </BlockFrame>
  );
}
