import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

export interface College {
  id: string;
  slug?: string | null;
  name: string;
  state: string | null;
  district: string | null;
  website: string | null;
  yearOfEstablishment: number | null;
  aisheCode?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  postCount?: number;
}

interface CollegesApiResponse {
  colleges: College[];
  hasMore?: boolean;
  total?: number;
}

export function useColleges(limit = 100, page = 1, searchQuery = "") {
  const { data, error, isLoading, mutate } = useSWR<CollegesApiResponse | College[]>(
    `/api/colleges?limit=${limit}&page=${page}${searchQuery.trim() ? `&q=${encodeURIComponent(searchQuery.trim())}` : ""}`,
    fetcher,
    {
      revalidateIfStale: true,
      keepPreviousData: true,
      dedupingInterval: 30000,
    }
  );

  const colleges = useMemo(() => {
    if (!data) return [];
    const raw = Array.isArray(data) ? data : data.colleges || [];
    return raw.filter((c) => c.slug !== "viewer-hub");
  }, [data]);

  const total = useMemo(() => {
    if (!data) return 0;
    return Array.isArray(data) ? data.length : Number(data.total ?? data.colleges?.length ?? 0);
  }, [data]);

  const hasMore = useMemo(() => {
    if (!data || Array.isArray(data)) return false;
    return Boolean(data.hasMore);
  }, [data]);

  function filterColleges(searchQuery: string, stateFilter = "ALL") {
    return colleges.filter((c) => {
      const matchesState = stateFilter === "ALL" || c.state?.toLowerCase() === stateFilter.toLowerCase();
      if (!matchesState) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q) ||
        c.district?.toLowerCase().includes(q)
      );
    });
  }

  return {
    colleges,
    total,
    hasMore,
    isLoading,
    error,
    mutate,
    filterColleges,
  };
}
