"use client";

import { Split } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PollSticker } from "@/components/ui/stickers";
import { apiRequest, fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import type { getThisOrThat, TotResult } from "@/lib/play/server/this-or-that";
import { announceBadges, PlayHeader, PlaySection } from "./play-ui";

type TotState = Awaited<ReturnType<typeof getThisOrThat>>;

function ResultSticker({ r, variant = "flat" }: { r: TotResult; variant?: "flat" | "sticker" }) {
  const total = r.everyone.a + r.everyone.b;
  return (
    <PollSticker
      variant={variant}
      showResults
      question={`${r.optionA} or ${r.optionB}?`}
      options={[
        { id: "A", label: r.optionA, votes: r.campus.a, chosen: r.myChoice === "A" },
        { id: "B", label: r.optionB, votes: r.campus.b, chosen: r.myChoice === "B" },
      ]}
      footer={`Your college: ${r.campus.a + r.campus.b} votes · All colleges: ${
        total ? Math.round((r.everyone.a / total) * 100) : 0
      }% picked ${r.optionA}`}
    />
  );
}

/** /play/this-or-that: one poll at a time; results only after you pick. */
export function ThisOrThatClient() {
  const { data, error, isLoading, mutate } = useSWR<TotState>("/api/play/this-or-that", fetcher, {
    revalidateOnFocus: false,
  });
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<TotResult | null>(null);
  const [busy, setBusy] = useState(false);

  const current = data?.next[index];

  async function pick(choice: "A" | "B") {
    if (!current || busy) return;
    setBusy(true);
    haptics.light();
    try {
      const res = await apiRequest<{ result: TotResult; newBadges?: Array<{ title: string; lp: number }> }>(
        "/api/play/this-or-that",
        "POST",
        { promptId: current.id, choice }
      );
      setResult(res.result);
      announceBadges(res.newBadges);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save your pick.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setResult(null);
    if (data && index + 1 >= data.next.length) {
      setIndex(0);
      void mutate();
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-10">
      <PlayHeader title="This or That" description="Pick a side. Then see how your college voted." />

      {isLoading ? (
        <Skeleton className="h-56 rounded-sticker" />
      ) : error || !data ? (
        <EmptyState bordered title="Couldn't load polls" action={<Button onClick={() => void mutate()}>Try again</Button>} />
      ) : result ? (
        <div className="space-y-3">
          <ResultSticker r={result} variant="sticker" />
          <Button size="lg" className="w-full" onClick={next}>
            Next
          </Button>
        </div>
      ) : current ? (
        <section aria-labelledby="tot-q" className="space-y-3">
          <h2 id="tot-q" className="sr-only">
            {current.optionA} or {current.optionB}?
          </h2>
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            {(["A", "B"] as const).map((side) => (
              <button
                key={side}
                type="button"
                disabled={busy}
                onClick={() => void pick(side)}
                className="sticker-caption flex min-h-32 items-center justify-center rounded-sticker border border-border-strong bg-sticker p-5 text-center text-2xl text-balance text-sticker-fg shadow-sticker transition-ui outline-none hover:bg-brand-subtle active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
              >
                {side === "A" ? current.optionA : current.optionB}
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-fg-muted">
            <span className="tabular-nums">{data.picks}</span> picked so far
          </p>
        </section>
      ) : (
        <EmptyState bordered icon={Split} title="You've answered every poll" description="New ones are added often. Check back soon." />
      )}

      {data && data.recent.length > 0 && (
        <PlaySection title="Your recent picks" id="tot-recent">
          <div className="space-y-3">
            {data.recent.map((r) => (
              <ResultSticker key={r.promptId} r={r} />
            ))}
          </div>
        </PlaySection>
      )}
    </div>
  );
}
