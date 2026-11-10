"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

/**
 * URL-backed state for the living hubs (search, filters, page).
 * The search box is debounced; every other filter writes straight to the URL
 * and resets to page 1.
 */
export function useHubQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("q") || "";
  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const [searchQuery, setSearchQuery] = useState(urlSearch);

  useEffect(() => setSearchQuery(urlSearch), [urlSearch]);

  const updateUrl = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutator(params);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: true });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const next = searchQuery.trim();
    if (next === urlSearch) return;

    const timer = window.setTimeout(() => {
      updateUrl((params) => {
        if (next) params.set("q", next);
        else params.delete("q");
        params.set("page", "1");
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery, updateUrl, urlSearch]);

  /** Sets one filter param; `fallback` (e.g. "all") removes it. */
  const setParam = useCallback(
    (key: string, value: string, fallback = "all") => {
      sounds.tap();
      haptics.light();
      updateUrl((params) => {
        if (value === fallback) params.delete(key);
        else params.set(key, value);
        params.set("page", "1");
      });
    },
    [updateUrl]
  );

  /** Removes several filter params at once. */
  const clearParams = useCallback(
    (keys: string[]) => {
      updateUrl((params) => {
        for (const key of keys) params.delete(key);
        params.set("page", "1");
      });
    },
    [updateUrl]
  );

  return {
    searchParams,
    urlSearch,
    page,
    searchQuery,
    setSearchQuery,
    updateUrl,
    setParam,
    clearParams,
  };
}
