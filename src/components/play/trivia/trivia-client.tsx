"use client";

import { Brain, Flame, Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Sticker } from "@/components/ui/stickers";
import { useProfile } from "@/hooks/use-profile";
import { apiRequest, fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import type { getTriviaState, ServedQuestion } from "@/lib/play/server/trivia";
import { sharePlayImage } from "../play-share-image";
import { announceBadges, PlayHeader, PlaySection, RankTile, timeLeft } from "../play-ui";
import { type Reveal, TriviaQuestion } from "./trivia-question";

type TriviaState = Awaited<ReturnType<typeof getTriviaState>>;

/** /play/trivia: today's quiz, your streak and today's campus top 10. */
export function TriviaClient() {
  const { data, error, isLoading, mutate } = useSWR<TriviaState>("/api/play/trivia", fetcher, { revalidateOnFocus: false });
  const { profile } = useProfile();
  const [q, setQ] = useState<ServedQuestion | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [busy, setBusy] = useState(false);

  const serve = useCallback(async (runId: string) => {
    const next = await apiRequest<ServedQuestion>("/api/play/trivia/question", "POST", { runId });
    setReveal(null);
    setQ(next);
  }, []);

  async function start() {
    setBusy(true);
    try {
      const { runId } = await apiRequest<{ runId: string }>("/api/play/trivia", "POST");
      await serve(runId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start the quiz.");
      void mutate();
    } finally {
      setBusy(false);
    }
  }

  const answer = useCallback(
    async (choice: number) => {
      if (!q || busy) return;
      setBusy(true);
      try {
        const res = await apiRequest<Omit<Reveal, "choice"> & { newBadges?: Array<{ title: string; lp: number }> }>(
          "/api/play/trivia/answer",
          "POST",
          { runId: q.runId, index: q.index, choice }
        );
        if (res.correct) haptics.success();
        else haptics.medium();
        setReveal({ ...res, choice });
        announceBadges(res.newBadges);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't save your answer.");
        void mutate();
        setQ(null);
      } finally {
        setBusy(false);
      }
    },
    [q, busy, mutate]
  );

  async function next() {
    if (!q) return;
    if (reveal?.done) {
      setQ(null);
      setReveal(null);
      await mutate();
      return;
    }
    setBusy(true);
    try {
      await serve(q.runId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load the next question.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!data?.run) return;
    await sharePlayImage(
      {
        kicker: "Today's campus quiz",
        title: `${data.run.score} points`,
        detail: `${data.run.correct} of ${data.run.total} right${data.streak.current > 1 ? ` · ${data.streak.current}-day streak` : ""}`,
        name: profile?.displayName ?? "Me",
        college: profile?.institution?.name ?? null,
      },
      "campusloop-quiz.png"
    );
  }

  if (q) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 pt-4 pb-10">
        <TriviaQuestion q={q} reveal={reveal} submitting={busy} onAnswer={answer} onNext={() => void next()} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-10">
      <PlayHeader title="Campus Trivia" description="5 questions a day, 20 seconds each. Faster right answers score more." />

      {isLoading ? (
        <Skeleton className="h-44 rounded-sticker" />
      ) : error || !data ? (
        <EmptyState bordered title="Couldn't load the quiz" action={<Button onClick={() => void mutate()}>Try again</Button>} />
      ) : (
        <Sticker pop className="space-y-3 p-5">
          {data.run?.status === "DONE" ? (
            <>
              <p className="text-sm font-semibold text-fg-muted">Today's score</p>
              <p className="sticker-caption text-5xl tabular-nums text-sticker-fg">{data.run.score}</p>
              <p className="text-base text-fg">
                {data.run.correct} of {data.run.total} right. Next quiz in {timeLeft(data.endsAt)}.
              </p>
              <Button variant="secondary" onClick={() => void share()}>
                <Share2 aria-hidden="true" />
                Share score
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-brand-text">
                <Brain aria-hidden="true" className="size-6" />
                <h2 className="sticker-caption text-2xl text-sticker-fg">Today's quiz</h2>
              </div>
              <p className="text-base text-fg">Tech, general knowledge, campus life and placements. One try a day.</p>
              <Button size="lg" onClick={start} loading={busy}>
                {data.run ? "Continue quiz" : "Start quiz"}
              </Button>
            </>
          )}
          <p className="flex items-center gap-1.5 text-sm font-semibold text-fg-muted">
            <Flame aria-hidden="true" className="size-4" />
            Streak: <span className="tabular-nums text-fg">{data.streak.current}</span> · Best:{" "}
            <span className="tabular-nums text-fg">{data.streak.best}</span>
          </p>
        </Sticker>
      )}

      {data && (
        <PlaySection title="Today's top 10 on campus" id="trivia-top">
          {data.leaderboard.length ? (
            <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
              {data.leaderboard.map((l) => (
                <li key={`${l.rank}-${l.username}`} className={`flex min-h-14 items-center gap-3 px-4 py-2 ${l.isMe ? "bg-brand-subtle" : ""}`}>
                  <RankTile rank={l.rank} />
                  <span className="min-w-0 flex-1 truncate font-semibold text-fg">
                    {l.displayName}
                    {l.isMe && <span className="font-normal text-brand-text"> (you)</span>}
                  </span>
                  <span className="shrink-0 text-right text-sm tabular-nums text-fg-muted">
                    <span className="font-bold text-fg">{l.score}</span> · {l.correct}/5
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-fg-muted">Nobody has finished today's quiz yet. Be first.</p>
          )}
        </PlaySection>
      )}
    </div>
  );
}
