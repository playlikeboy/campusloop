"use client";

import { ArrowLeft, ArrowRight, EyeOff, Globe, HeartCrack, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { DatingCardSkeleton } from "@/components/dating/dating-card-skeleton";
import { DatingMatchModal } from "@/components/dating/dating-match-modal";
import { GenderGate } from "@/components/dating/gender-gate";
import { candidatePhotos } from "@/components/dating/swipe-card";
import { type Candidate, SwipeActions, SwipeDeck } from "@/components/dating/swipe-deck";
import { LocationOptInCard } from "@/components/geo/location-opt-in-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useProfile } from "@/hooks/use-profile";
import { fetcher } from "@/lib/api";

type MatchResult = {
  matched: boolean;
  conversationId?: string;
  matchedUser?: { displayName: string; avatarUrl: string | null };
};

type ProfilesResponse = {
  candidates: Candidate[];
  meta: {
    showingGender: "MALE" | "FEMALE" | "ALL";
    likesYouCount: number;
    isMatchingEnabled?: boolean;
  };
};

/** Arrow keys swipe only when focus is not in a text field or a dialog. */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    !!target.closest("[role='dialog']")
  );
}

export function DatingAppClient() {
  const { profile, mutate: mutateProfile } = useProfile();
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [deckIndex, setDeckIndex] = useState(0);
  const [lastSwipedId, setLastSwipedId] = useState<string | null>(null);

  // Saved preferences drive the deck on the server, so no params are needed.
  const { data, error, isLoading, mutate } = useSWR<ProfilesResponse>("/api/dating/profiles", fetcher, {
    revalidateIfStale: true,
    keepPreviousData: true,
    dedupingInterval: 15000,
  });

  const candidates = useMemo(() => data?.candidates ?? [], [data]);
  const remaining = useMemo(() => candidates.slice(deckIndex), [candidates, deckIndex]);
  const isMatchingEnabled = data?.meta?.isMatchingEnabled !== false;

  const hasGenderSet = profile?.gender && ["MALE", "FEMALE", "OTHER"].includes(profile.gender);
  const genderGateRequired =
    (profile && !hasGenderSet) || (error as { error?: string } | undefined)?.error === "GENDER_REQUIRED";

  const sendSwipe = useCallback(async (targetId: string, direction: "LIKE" | "PASS") => {
    setLastSwipedId(targetId);
    setDeckIndex((prev) => prev + 1);
    try {
      const res = await fetch("/api/dating/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, direction }),
      });
      if (!res.ok) throw new Error();
      const result = (await res.json()) as MatchResult;
      if (result.matched) setMatchResult(result);
    } catch {
      setDeckIndex((prev) => Math.max(prev - 1, 0));
      setLastSwipedId(null);
      toast.error("That swipe didn't go through. Check your connection and try again.");
    }
  }, []);

  // Preload the next few photos so swiping feels instant.
  useEffect(() => {
    for (const c of candidates.slice(deckIndex, deckIndex + 5)) {
      const first = candidatePhotos(c)[0];
      if (first) {
        const img = new Image();
        img.src = first;
      }
    }
  }, [candidates, deckIndex]);

  const handleSwipe = useCallback(
    async (direction: "like" | "pass") => {
      const current = remaining[0];
      if (!current) return;
      await sendSwipe(current.id, direction === "like" ? "LIKE" : "PASS");
      if (deckIndex >= candidates.length - 2) void mutate();
    },
    [remaining, candidates.length, deckIndex, sendSwipe, mutate]
  );

  const handleUndo = useCallback(async () => {
    if (!lastSwipedId) return;
    try {
      const res = await fetch(`/api/dating/swipe?targetId=${encodeURIComponent(lastSwipedId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setDeckIndex((i) => Math.max(0, i - 1));
      setLastSwipedId(null);
    } catch {
      toast.error("Couldn't undo. Try again in a moment.");
    }
  }, [lastSwipedId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (matchResult || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === "ArrowLeft") void handleSwipe("pass");
      else if (e.key === "ArrowRight") void handleSwipe("like");
      else if (e.key.toLowerCase() === "u") void handleUndo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSwipe, handleUndo, matchResult]);

  async function updatePreferences(updates: { gender?: string; scope?: string; isEnabled?: boolean }) {
    try {
      const res = await fetch("/api/dating/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      setDeckIndex(0);
      setLastSwipedId(null);
      void mutate();
    } catch {
      toast.error("Couldn't update. Check your connection and try again.");
    }
  }

  async function resetSwipes() {
    const res = await fetch("/api/dating/swipe", { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      toast.error("Couldn't bring back skipped profiles. Try again in a moment.");
      return;
    }
    setDeckIndex(0);
    setLastSwipedId(null);
    void mutate();
  }

  let body: React.ReactNode;
  if (genderGateRequired) {
    body = (
      <GenderGate
        onSaved={async () => {
          await mutateProfile();
          void mutate();
        }}
      />
    );
  } else if (error) {
    body = (
      <EmptyState
        icon={HeartCrack}
        title="Couldn't load profiles"
        description="Check your connection and try again. Your settings are safe."
        action={<Button onClick={() => void mutate()}>Try again</Button>}
        className="m-auto"
      />
    );
  } else if (isLoading && candidates.length === 0) {
    body = <DatingCardSkeleton />;
  } else if (remaining.length > 0) {
    body = (
      <>
        <LocationOptInCard
          title="Find matches near you"
          description="Nearby students show up first. Others only see a rough distance, like 'Within 5 km'."
          className="mb-2"
        />
        {/* 36dvh keeps the card plus the 56px actions above the bottom nav on a 360x640 phone. */}
        <div className="relative flex min-h-[min(36dvh,500px)] flex-1 flex-col py-1">
          <SwipeDeck candidates={remaining} onSwipe={handleSwipe} />
        </div>
        <div className="pt-3">
          <SwipeActions
            onPass={() => void handleSwipe("pass")}
            onLike={() => void handleSwipe("like")}
            onUndo={() => void handleUndo()}
            canUndo={!!lastSwipedId}
          />
        </div>
        <p className="hidden items-center justify-center gap-1.5 pt-2 text-xs text-fg-subtle sm:flex">
          Keyboard: <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span className="sr-only">Left arrow</span> pass,
          <ArrowRight className="size-3.5" aria-hidden="true" />
          <span className="sr-only">Right arrow</span> like, U undo
        </p>
      </>
    );
  } else {
    body = (
      <EmptyState
        icon={Users}
        title="You've seen everyone for now"
        description="Look at other colleges too, or check back later."
        action={
          <div className="flex flex-col items-center gap-1">
            <Button onClick={() => void updatePreferences({ scope: "GLOBAL", gender: "ALL" })}>
              <Globe />
              Show all colleges
            </Button>
            <Button variant="link" onClick={() => void resetSwipes()}>
              See skipped profiles again
            </Button>
          </div>
        }
        className="m-auto"
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-4 text-fg select-none">
      {!isMatchingEnabled && (
        <div className="my-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted px-4 py-2.5">
          <p className="flex min-w-0 items-center gap-2 text-sm text-fg">
            <EyeOff className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
            <span>Your profile is hidden. New people can't see you.</span>
          </p>
          <Button size="sm" variant="outline" onClick={() => void updatePreferences({ isEnabled: true })}>
            Show me
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col py-1">{body}</div>

      <DatingMatchModal matchResult={matchResult} onClose={() => setMatchResult(null)} />
    </div>
  );
}
