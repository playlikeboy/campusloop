"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { QuestionSticker } from "@/components/ui/stickers";
import { trackFirstPost } from "@/lib/analytics/ga4";
import { markMeaningfulAction } from "@/lib/notification-prompt";

const RATINGS = [1, 2, 3, 4, 5] as const;
const MAX_CHARS = 140;

/**
 * The first-post moment. A one-tap rating posts straight away; typing a line
 * works too. Posting counts as the student's first real action, which is when
 * we may ask for notification permission.
 */
export function StepFirstPost({
  collegeName,
  onDone,
}: {
  collegeName: string | null;
  onDone: (posted: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [posting, setPosting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(body: string, source: "rating" | "text") {
    if (posting) return;
    setPosting(source);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, type: "NORMAL", scope: "CAMPUS", isAnonymous: anonymous }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Couldn't post that. Try again.");
        setPosting(null);
        return;
      }
      trackFirstPost({ anonymous, source });
      markMeaningfulAction();
      onDone(true);
    } catch {
      setError("Couldn't post. Check your connection and try again.");
      setPosting(null);
    }
  }

  const where = collegeName ? `at ${collegeName}` : "on your campus";

  return (
    <div className="space-y-5">
      <p className="text-base text-fg-muted">
        Say one thing to your campus. It shows up in the feed {where}.
      </p>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-fg">One tap: rate your hostel mess today</p>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((n) => (
            <Chip
              key={n}
              onClick={() => void post(`Rating our hostel mess today: ${n}/5`, "rating")}
              disabled={Boolean(posting)}
              className="min-w-14 justify-center tabular-nums"
              aria-label={`Post a ${n} out of 5 rating`}
            >
              {n}/5
            </Chip>
          ))}
        </div>
      </div>

      <QuestionSticker
        variant="flat"
        prompt="Or write one line"
        value={text}
        onChange={setText}
        onSubmit={(value) => void post(value, "text")}
        placeholder="Best chai near campus is…"
        submitLabel="Post"
        maxLength={MAX_CHARS}
        loading={posting === "text"}
        disabled={Boolean(posting)}
      />

      <Chip selected={anonymous} onSelectedChange={setAnonymous} size="sm">
        {anonymous ? "Posting anonymously" : "Posting with my name"}
      </Chip>

      {error && (
        <p role="alert" className="rounded-md bg-danger-subtle p-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={Boolean(posting)}
        onClick={() => onDone(false)}
      >
        Skip for now
      </Button>
    </div>
  );
}
