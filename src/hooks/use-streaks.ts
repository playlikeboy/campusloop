"use client";

import useSWR from "swr";
import { toast } from "sonner";
import type { StreakMilestone, StreakEventType } from "@/constants/streaks";
import type { UserStreakState } from "@/lib/streaks/streak-service";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface QualifyResult {
  success: boolean;
  alreadyQualifiedToday: boolean;
  currentStreak: number;
  longestStreak: number;
  isSafeToday: boolean;
  pointsEarned: number;
  newMilestone?: StreakMilestone;
}

export function useStreaks(profileId?: string) {
  const endpoint = profileId ? `/api/streaks/me?profileId=${profileId}` : "/api/streaks/me";
  const { data, error, isLoading, mutate } = useSWR<UserStreakState>(
    endpoint,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
    }
  );

  const qualifyActivity = async (
    eventType: StreakEventType = "DAILY_MISSION_COMPLETE",
    sourceEntityId?: string
  ): Promise<QualifyResult | null> => {
    try {
      const res = await fetch("/api/streaks/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, sourceEntityId }),
      });

      if (!res.ok) {
        throw new Error("Failed to record streak activity");
      }

      const result: QualifyResult = await res.json();

      if (result.success) {
        if (!result.alreadyQualifiedToday) {
          sounds.ting();
          haptics.success();
          toast.success(
            `Streak Extended! ${result.currentStreak} days strong (+${result.pointsEarned} LP)`
          );

          if (result.newMilestone) {
            sounds.pop();
            toast(`Milestone Unlocked: ${result.newMilestone.title}!`, {
              description: `You reached a ${result.newMilestone.days}-day streak and earned a bonus +${result.newMilestone.points} LP!`,
            });
          }
        } else {
          sounds.tap();
          haptics.light();
          toast.info("Your streak is already safe today. Keep your loop going!");
        }

        // Revalidate local state
        await mutate();
      }

      return result;
    } catch (err) {
      console.error("[useStreaks] qualifyActivity failed:", err);
      toast.error("Could not update streak state. Please try again.");
      return null;
    }
  };

  return {
    streak: data || null,
    isLoading,
    isError: Boolean(error),
    mutate,
    qualifyActivity,
  };
}
