"use client";

import { Check, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, initialOf } from "@/lib/utils";
import { type FollowSuggestions, getFollowSuggestions } from "./actions";

/**
 * Screen 3: follow your campus. Everyone suggested starts ticked, so the
 * usual path is one tap on Continue. The headline is a live count of real,
 * verified classmates.
 */
export function StepFollow({
  saving,
  onDone,
}: {
  saving: boolean;
  onDone: (profileIds: string[]) => void;
}) {
  const [data, setData] = useState<FollowSuggestions | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getFollowSuggestions()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setPicked(new Set(result.people.map((p) => p.id)));
      })
      .catch(() => {
        if (!cancelled) setData({ campusName: null, classmates: 0, people: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-6 w-2/3" />
        {["a", "b", "c", "d"].map((k) => (
          <Skeleton key={k} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const campus = data.campusName ?? "your college";
  const headline =
    data.classmates > 0
      ? `${data.classmates} ${data.classmates === 1 ? "student" : "students"} from ${campus} ${data.classmates === 1 ? "is" : "are"} here`
      : `You're one of the first from ${campus}`;

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <p className="sticker-caption text-2xl text-fg">{headline}</p>

      {data.people.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-fg-muted">Follow them to fill your feed. You can unfollow any time.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setPicked(picked.size === data.people.length ? new Set() : new Set(data.people.map((p) => p.id)))
              }
            >
              {picked.size === data.people.length ? "Clear all" : "Pick all"}
            </Button>
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {data.people.map((person) => {
              const on = picked.has(person.id);
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => toggle(person.id)}
                    aria-pressed={on}
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left outline-none transition-ui hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <Avatar size="sm">
                      {person.avatarUrl ? <AvatarImage src={person.avatarUrl} alt="" /> : null}
                      <AvatarFallback>{initialOf(person.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">{person.displayName}</span>
                      <span className="block truncate text-xs text-fg-muted">
                        {person.detail ?? `@${person.username}`}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full border transition-ui",
                        on ? "border-brand bg-brand text-brand-fg" : "border-border-strong bg-surface text-transparent"
                      )}
                      aria-hidden="true"
                    >
                      <Check className="size-4" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="flex gap-3 rounded-lg bg-surface-muted p-4 text-sm text-fg-muted">
          <Users className="mt-0.5 size-4 shrink-0 text-fg" aria-hidden="true" />
          Nobody to follow yet. Invite a friend after this and your feed fills up faster.
        </p>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        loading={saving}
        onClick={() => onDone(Array.from(picked))}
      >
        {picked.size > 0 ? `Follow ${picked.size} and continue` : "Continue"}
      </Button>
    </div>
  );
}
