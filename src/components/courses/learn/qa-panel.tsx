"use client";

import { Loader2, MessageCircle } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
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

/** Questions for the current lecture, with answers from other learners. */
export function QaPanel({ slug, lectureId }: { slug: string; lectureId: string }) {
  const { data, mutate } = useSWR<{ questions: Question[] }>(`/api/courses/${slug}/questions?lectureId=${lectureId}`, fetcher);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<Record<string, string>>({});
  const stop = (e: React.KeyboardEvent) => e.stopPropagation();

  async function ask() {
    setBusy(true);
    try {
      await courseAction(`/api/courses/${slug}/questions`, { title, body, lectureId });
      setTitle("");
      setBody("");
      await mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post question");
    } finally {
      setBusy(false);
    }
  }

  async function answer(questionId: string) {
    try {
      await courseAction(`/api/courses/${slug}/questions`, { questionId, body: reply[questionId] });
      setReply((r) => ({ ...r, [questionId]: "" }));
      await mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post answer");
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-2xl bg-muted/40 p-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={stop} maxLength={200} placeholder="Ask a question about this lecture" className="h-10 w-full rounded-xl bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
        {title && <textarea value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={stop} rows={3} maxLength={4000} placeholder="Add details: what you tried, the timestamp, an error (optional)" className="w-full resize-none rounded-xl bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />}
        <button type="button" onClick={ask} disabled={busy || title.trim().length < 5} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Post question
        </button>
      </div>
      {!data ? (
        <div className="h-20 animate-pulse rounded-2xl bg-muted/50" />
      ) : data.questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions on this lecture yet. Be the first to ask.</p>
      ) : (
        <ul className="space-y-3">
          {data.questions.map((q) => (
            <li key={q.id} className="rounded-2xl bg-card/60 p-4 shadow-2xs">
              <p className="font-semibold text-foreground">{q.title}</p>
              {q.body && <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{q.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{q.author.displayName} · {formatTimeAgo(q.createdAt)}</p>
              {q.answers.length > 0 && (
                <ul className="mt-3 space-y-2 border-l-2 border-border pl-3">
                  {q.answers.map((a) => (
                    <li key={a.id}>
                      <p className="whitespace-pre-wrap text-sm text-foreground">{a.body}</p>
                      <p className="text-xs text-muted-foreground">{a.author.displayName} · {formatTimeAgo(a.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex gap-2">
                <input value={reply[q.id] ?? ""} onChange={(e) => setReply((r) => ({ ...r, [q.id]: e.target.value }))} onKeyDown={stop} placeholder="Write an answer" className="h-9 min-w-0 flex-1 rounded-xl bg-muted/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                <button type="button" onClick={() => answer(q.id)} disabled={!reply[q.id]?.trim()} aria-label="Post answer" className="inline-flex h-9 items-center gap-1 rounded-xl bg-muted px-3 text-sm font-semibold text-foreground disabled:opacity-50 cursor-pointer">
                  <MessageCircle className="size-4" aria-hidden /> Reply
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
