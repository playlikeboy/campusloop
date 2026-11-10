"use client";

import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { HousingCard } from "@/components/communities/housing-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fetcher } from "@/lib/api";
import { FilterSheet } from "../living/_components/filter-sheet";
import { ChipRow, HubLayout, HubSearch } from "../living/_components/hub-layout";
import { HubResults } from "../living/_components/hub-results";
import { useHubQuery } from "../living/_components/use-hub-query";

interface Props {
  profileId: string;
}

interface FeedResponse {
  items: any[];
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const BUDGET_FILTERS = [
  { id: "all", label: "Any rent" },
  { id: "under_5k", label: "Under ₹5,000" },
  { id: "5k_10k", label: "₹5,000 to ₹10,000" },
  { id: "above_10k", label: "Over ₹10,000" },
] as const;

const GENDER_FILTERS = [
  { id: "all", label: "Anyone" },
  { id: "BOYS_ONLY", label: "Boys only" },
  { id: "GIRLS_ONLY", label: "Girls only" },
  { id: "COED", label: "Co-ed" },
] as const;

const OCCUPANCY_FILTERS = [
  { id: "all", label: "Any room" },
  { id: "SINGLE_ROOM", label: "Single room" },
  { id: "DOUBLE_SHARING", label: "Double sharing" },
  { id: "TRIPLE_SHARING", label: "Triple sharing" },
  { id: "FULL_FLAT", label: "Full flat" },
] as const;

export function HousingClient({ profileId }: Props) {
  const { searchParams, urlSearch, page, searchQuery, setSearchQuery, setParam, clearParams } = useHubQuery();

  const budget = searchParams.get("budget") || "all";
  const gender = searchParams.get("gender") || "all";
  const occupancy = searchParams.get("occupancy") || "all";

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams({ tab: "housing", page: String(page), limit: "16" });
    if (urlSearch) params.set("q", urlSearch);
    if (gender !== "all") params.set("gender", gender);
    if (occupancy !== "all") params.set("occupancy", occupancy);
    return `/api/communities/feed?${params.toString()}`;
  }, [gender, occupancy, page, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<FeedResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  // Rent is filtered on this page; the API filters gender and room type.
  const listings = useMemo(
    () =>
      (data?.items || [])
        .filter((item) => item.itemType === "HOUSING" && item.data)
        .map((item) => item.data)
        .filter((item) => {
          if (budget === "under_5k") return item.rentPerMonth < 5000;
          if (budget === "5k_10k") return item.rentPerMonth >= 5000 && item.rentPerMonth <= 10000;
          if (budget === "above_10k") return item.rentPerMonth > 10000;
          return true;
        }),
    [budget, data?.items]
  );

  const hasFilters = Boolean(urlSearch) || budget !== "all" || gender !== "all" || occupancy !== "all";

  return (
    <HubLayout
      title="Housing"
      description="Rooms, PGs and flatmates near campus, posted by students."
      action={{ href: "/housing/new", label: "List a room" }}
    >
      <div className="flex items-center gap-2">
        <HubSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search area, PG name or landmark"
          label="Search housing"
        />
        <FilterSheet
          title="Filter rooms"
          groups={[
            { key: "gender", label: "Who can stay", value: gender, options: GENDER_FILTERS },
            { key: "occupancy", label: "Room type", value: occupancy, options: OCCUPANCY_FILTERS },
          ]}
          onChange={(key, value) => setParam(key, value)}
          onClear={() => clearParams(["budget", "gender", "occupancy"])}
        />
      </div>

      <ChipRow label="Monthly rent">
        {BUDGET_FILTERS.map((b) => (
          <Chip key={b.id} size="sm" selected={budget === b.id} onClick={() => setParam("budget", b.id)}>
            {b.label}
          </Chip>
        ))}
      </ChipRow>

      <HubResults
        isLoading={isLoading && !data}
        error={error}
        onRetry={() => void mutate()}
        noun="rooms"
        count={listings.length}
        isValidating={isValidating && Boolean(data)}
        page={data?.page || page}
        totalPages={data?.totalPages || 1}
        gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2"
        skeletonClassName="h-80"
        empty={{
          icon: Building2,
          title: hasFilters ? "No rooms match that" : "No rooms listed yet",
          description: hasFilters
            ? "Try another area or clear the filters."
            : "Moving out or need a flatmate? List your room here.",
          action: hasFilters ? (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery("");
                clearParams(["q", "budget", "gender", "occupancy"]);
              }}
            >
              Clear search and filters
            </Button>
          ) : (
            <Button asChild>
              <Link href="/housing/new">
                <Plus className="size-4" aria-hidden="true" />
                List a room
              </Link>
            </Button>
          ),
        }}
      >
        {listings.map((item) => (
          <HousingCard key={item.id} item={item} currentUserId={profileId} />
        ))}
      </HubResults>
    </HubLayout>
  );
}
