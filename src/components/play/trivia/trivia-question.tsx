"use client";

import { Check, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRIVIA_CATEGORY_LABELS } from "@/constants/play";
import type { ServedQuestion } from "@/lib/play/server/trivia";
import { cn } from "@/lib/utils";

export interface Reveal {
  choice: number;
  answerIndex: number;
  correct: boolean;
  late: boolean;
  points: number;
  explanation: string | null;
  done: boolean;
}

const LETTERS = ["A", "B", "C", "D"];

/** One timed question. Counts down from the server's remaining time; at zero it submits "no answer". */
export function TriviaQuestion({
  q,
  reveal,
  submitting,
  onAnswer,
  onNext,
}: {
  q: ServedQuestion;
  reveal: Reveal | null;
  submitting: boolean;
  onAnswer: (choice: number) => void;
  onNext: () => void;
}) {
  const endsAt = useRef(0);
  const [left, setLeft] = useState(q.remainingMs);
  const fired = useRef(false);

  useEffect(() => {
    endsAt.current = Date.now() + q.remainingMs;
    fired.current = false;
    setLeft(q.remainingMs);
  }, [q]);

  useEffect(() => {
    if (reveal) return;
    const t = setInterval(() => {
      const ms = Math.max(0, endsAt.current - Date.now());
      setLeft(ms);
      if (ms === 0 && !fired.current) {
        fired.current = true;
        onAnswer(-1);
      }
    }, 200);
    return () => clearInterval(t);
  }, [reveal, onAnswer]);

  const seconds = Math.ceil(left / 1000);
  const pct = Math.round((left / 20_000) * 100);

  return (
    <section aria-labelledby="trivia-q" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold tabular-nums text-fg-muted">
          Question {q.index + 1} of {q.total}
        </span>
        <Badge variant="neutral">{TRIVIA_CATEGORY_LABELS[q.category] ?? q.category}</Badge>
      </div>

      {!reveal && (
        <div className="flex items-center gap-2">
          <Timer aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
          <div
            className="relative h-2.5 flex-1 overflow-hidden rounded-sm bg-poll-track"
            role="timer"
            aria-label={`${seconds} seconds left`}
          >
            <div
              className={cn("poll-fill absolute inset-0", seconds <= 5 ? "bg-danger" : "bg-brand")}
              style={{ "--fill": pct } as React.CSSProperties}
            />
          </div>
          <span className="w-8 text-right text-sm font-bold tabular-nums text-fg">{seconds}s</span>
        </div>
      )}

      <h2 id="trivia-q" className="sticker-caption text-2xl leading-tight text-balance text-fg">
        {q.question}
      </h2>

      <ul className="space-y-2">
        {q.options.map((opt, i) => {
          const isAnswer = reveal && i === reveal.answerIndex;
          const isWrongPick = reveal && i === reveal.choice && i !== reveal.answerIndex;
          return (
            <li key={opt}>
              <button
                type="button"
                disabled={Boolean(reveal) || submitting}
                onClick={() => onAnswer(i)}
                className={cn(
                  "flex min-h-13 w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-base transition-ui outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !reveal && "border-border-strong bg-surface text-fg hover:border-brand hover:bg-brand-subtle",
                  isAnswer && "border-verified-text bg-verified-subtle text-verified-text",
                  isWrongPick && "border-danger bg-danger-subtle text-danger",
                  reveal && !isAnswer && !isWrongPick && "border-border bg-surface text-fg-muted"
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface-muted text-sm font-bold text-fg">
                  {isAnswer ? <Check aria-hidden="true" className="size-4" /> : isWrongPick ? <X aria-hidden="true" className="size-4" /> : LETTERS[i]}
                </span>
                <span className="min-w-0 flex-1 font-semibold">{opt}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {reveal && (
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4" aria-live="polite">
          <p className={cn("text-lg font-bold", reveal.correct ? "text-verified-text" : "text-danger")}>
            {reveal.correct
              ? `Right! +${reveal.points}`
              : reveal.late
                ? "Right answer, but time was up."
                : reveal.choice === -1
                  ? "Time's up."
                  : "Not this time."}
          </p>
          {reveal.explanation && <p className="text-sm text-fg">{reveal.explanation}</p>}
          <Button size="lg" className="w-full" onClick={onNext}>
            {reveal.done ? "See your score" : "Next question"}
          </Button>
        </div>
      )}
    </section>
  );
}
