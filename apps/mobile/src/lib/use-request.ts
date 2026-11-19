// Tiny data hooks: one request, or an offset-paged list. Each exposes
// loading / error / refreshing so every screen can show all three states.
import { useCallback, useEffect, useRef, useState } from "react";

import { errorMessage } from "./api";

export function useRequest<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    try {
      const result = await loadRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      if (mode !== "silent") setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    run("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    setData,
    error,
    loading,
    refreshing,
    reload: () => run("initial"),
    refresh: () => run("refresh"),
    poll: () => run("silent"),
  };
}

export function usePagedList<T extends { id: string }>(
  loadPage: (page: number) => Promise<T[]>,
  pageSize: number,
  deps: unknown[] = []
) {
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);
  const page = useRef(1);
  const busy = useRef(false);
  const loadRef = useRef(loadPage);
  loadRef.current = loadPage;

  const loadFirst = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    busy.current = true;
    try {
      const rows = await loadRef.current(1);
      page.current = 1;
      setItems(rows);
      setDone(rows.length < pageSize);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busy.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (busy.current || done) return;
    busy.current = true;
    setLoadingMore(true);
    try {
      const rows = await loadRef.current(page.current + 1);
      page.current += 1;
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...rows.filter((r) => !seen.has(r.id))];
      });
      if (rows.length < pageSize) setDone(true);
    } catch {
      // Keep what we have; the student can scroll again to retry.
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  }, [done, pageSize]);

  useEffect(() => {
    loadFirst("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    items,
    setItems,
    error,
    loading,
    refreshing,
    loadingMore,
    done,
    reload: () => loadFirst("initial"),
    refresh: () => loadFirst("refresh"),
    loadMore,
  };
}
