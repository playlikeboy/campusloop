"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { CampusStats } from "@/lib/growth/campus-stats";

/** Live counts for the signed-in student's college. Null when signed out or in Campus Preview. */
export function useCampusStats(enabled = true) {
  const { data, isLoading } = useSWR<{ campus: CampusStats | null }>(
    enabled ? "/api/growth/campus" : null,
    fetcher,
    { dedupingInterval: 60_000, refreshInterval: 120_000, revalidateOnFocus: false }
  );
  return { campus: data?.campus ?? null, isLoading };
}
