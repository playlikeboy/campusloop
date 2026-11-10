"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/db/schema";

interface Options {
  enabled?: boolean;
  /** Search even when the query is empty (the API then returns suggestions). */
  allowEmpty?: boolean;
  excludeId?: string;
  limit?: number;
  delayMs?: number;
}

/** Debounced people search against /api/chat/search. Stale responses are dropped. */
export function usePeopleSearch(
  query: string,
  { enabled = true, allowEmpty = false, excludeId, limit, delayMs = 250 }: Options = {}
) {
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!enabled || (!q && !allowEmpty)) {
      setResults([]);
      setLoading(false);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/chat/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error(String(res.status));
        let users = (await res.json()) as UserProfile[];
        if (excludeId) users = users.filter((u) => u.id !== excludeId);
        if (limit) users = users.slice(0, limit);
        if (!cancelled) {
          setResults(users);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled, allowEmpty, excludeId, limit, delayMs]);

  return { results, loading, failed };
}
