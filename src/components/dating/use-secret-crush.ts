"use client";

import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import type { SecretCrushResponse } from "./crush-types";

const KEY = "/api/dating/crush";

/** Secret Crush list plus add/remove actions. One source for /crush and the Match "Crush" tab. */
export function useSecretCrush(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<SecretCrushResponse>(enabled ? KEY : null, fetcher);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const crushes = data?.crushes ?? [];
  const maxSlots = data?.maxSlots ?? 5;
  const usedSlots = data?.usedSlots ?? crushes.length;
  const maxAttempts = data?.maxAttemptsIn7Days ?? 5;
  const attemptsLeft = data?.remainingAttemptsIn7Days ?? Math.max(0, maxAttempts - usedSlots);
  const canAdd = usedSlots < maxSlots && attemptsLeft > 0;

  /** Returns true when the crush was saved. */
  async function add(targetId: string, targetName: string): Promise<boolean> {
    setSubmitting(true);
    try {
      const res = await fetch(KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; matched?: boolean };
      if (!res.ok) throw new Error(body.error || "Couldn't add your crush. Try again in a moment.");

      if (body.matched) {
        sounds.match();
        haptics.match();
        toast.success(`It's mutual! You and ${targetName} both added each other.`, { duration: 6000 });
      } else {
        sounds.archive();
        haptics.success();
        toast.success(`Added ${targetName}. They only find out if they add you too.`);
      }
      void mutate();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add your crush. Try again in a moment.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(crushId: string) {
    sounds.tap();
    haptics.light();
    setRemovingId(crushId);
    try {
      const res = await fetch(`${KEY}?id=${encodeURIComponent(crushId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Removed. This week's add is not given back.");
      void mutate();
    } catch {
      toast.error("Couldn't remove. Check your connection and try again.");
    } finally {
      setRemovingId(null);
    }
  }

  return {
    data,
    error,
    isLoading,
    reload: () => void mutate(),
    crushes,
    maxSlots,
    usedSlots,
    maxAttempts,
    attemptsLeft,
    canAdd,
    receivedCount: data?.receivedCrushesCount ?? 0,
    submitting,
    removingId,
    add,
    remove,
  };
}
