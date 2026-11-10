"use client";

import { MessageCircleQuestion, WifiOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionSticker } from "@/components/ui/stickers";
import { courseAction } from "@/hooks/use-courses";
import { fetcher } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";

interface Author {
  displayName: string;
  username: string;
}
interface Question {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  author: Author;
  answers: { id: string; body: string; createdAt: string; author: Author }[];
}

const stop = (e: React.KeyboardEvent) => e.stopPropagation();

/** Questions on the current lecture, answered by other learners. */
export function QaPanel({ slug, lectureId }: { slug: string; lectureId: string }) {
  const { data, error, mutate } = useSWR<{ questions: Question[] }>(
    `/api/courses/${slug}/questions?lectureId=${lectureId}`,
    fetcher
  );
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [answering, setAnswering] = useState<string | null>(null);

  async function ask() {
    if (title.trim().length < 5) {
      toast.error("Write a bit more so people know what you're asking (at least 5 characters).");
      return;
    }
    setBusy(true);
    try {
      await courseAction(`/api/courses/${slug}/questions`, { title, body: "", lectureId });
      setTitle("");
      await mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't post your question. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function answer(questionId: string) {
    setAnswering(questionId);
    try {
      await courseAction(`/api/courses/${slug}/questions`, { questionId, body: reply[questionId] });
      setReply((r) => ({ ...r, [questionId]: "" }));
      await mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't post your answer. Try again.");
    } finally {
      setAnswering(null);
    }
  }

  return (
    <div className="space-y-5" onKeyDown={stop}>
      <QuestionSticker
        variant="flat"
        prompt="Ask about this lecture"
        value={title}
        onChange={setTitle}
        onSubmit={ask}
        placeholder="What are you stuck on?"
        submitLabel="Ask"
        maxLength={200}
        loading={busy}
      />

      {error ? (
        <EmptyState
          size="compact"
          icon={WifiOff}
          title="Couldn't load questions"
          description="Check your connection, then try again."
          action={
            <Button variant="secondary" onClick={() => mutate()}>
              Try again
            </Button>
          }
        />
      ) : !data ? (
        <Skeleton className="h-24 rounded-lg" />
      ) : data.questions.length === 0 ? (
        <EmptyState
          size="compact"
          icon={MessageCircleQuestion}
          title="No questions yet"
          description="Ask the first one. Other learners can answer."
        />
      ) : (
        <ul className="space-y-3">
          {data.questions.map((q) => (
            <li key={q.id} className="rounded-lg border border-border bg-surface p-4">
              <p className="font-semibold text-fg">{q.title}</p>
              {q.body && <p className="mt-1 whitespace-pre-wrap text-sm text-fg">{q.body}</p>}
              <p className="mt-1 text-xs text-fg-subtle">
                {q.author.displayName} · {formatTimeAgo(q.createdAt)}
              </p>
              {q.answers.length > 0 && (
                <ul className="mt-3 space-y-3 rounded-md bg-surface-muted p-3">
                  {q.answers.map((a) => (
                    <li key={a.id}>
                      <p className="whitespace-pre-wrap text-sm text-fg">{a.body}</p>
                      <p className="mt-0.5 text-xs text-fg-subtle">
                        {a.author.displayName} · {formatTimeAgo(a.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (reply[q.id]?.trim() && answering !== q.id) answer(q.id);
                }}
              >
                <Input
                  value={reply[q.id] ?? ""}
                  onChange={(e) => setReply((r) => ({ ...r, [q.id]: e.target.value }))}
                  placeholder="Write an answer"
                  aria-label={`Answer "${q.title}"`}
                  className="h-11 flex-1"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  loading={answering === q.id}
                  disabled={!reply[q.id]?.trim()}
                >
                  Reply
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
