"use client";

import { Globe, PackageSearch, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { LostFoundCard } from "@/components/communities/lost-found-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { fetcher } from "@/lib/api";
import { FilterSheet } from "../living/_components/filter-sheet";
import { ChipRow, HubLayout, HubSearch } from "../living/_components/hub-layout";
import { HubResults } from "../living/_components/hub-results";
import { useHubQuery } from "../living/_components/use-hub-query";

interface Props {
  profileId: string;
  campusId?: string | null;
}

interface ApiResponse {
  items: any[];
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  userCampusId?: string | null;
}

type Scope = "MY_CAMPUS" | "ALL";

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "LOST", label: "Lost" },
  { id: "FOUND", label: "Found" },
  { id: "RESOLVED", label: "Returned" },
] as const;

const CATEGORY_FILTERS = [
  { id: "All", label: "Any category" },
  { id: "Electronics", label: "Electronics" },
  { id: "ID & Cards", label: "ID and cards" },
  { id: "Keys", label: "Keys" },
  { id: "Cycles", label: "Cycles" },
  { id: "Bags", label: "Bags" },
  { id: "Clothing", label: "Clothes" },
  { id: "Books", label: "Books" },
  { id: "Other", label: "Other" },
] as const;

export function LostFoundClient({ profileId }: Props) {
  const { searchParams, urlSearch, page, searchQuery, setSearchQuery, setParam, clearParams } = useHubQuery();

  const filterType = searchParams.get("type") || "all";
  const filterCategory = searchParams.get("category") || "All";
  const scope: Scope = searchParams.get("scope") === "ALL" ? "ALL" : "MY_CAMPUS";

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "18", scope });
    if (urlSearch) params.set("q", urlSearch);
    if (filterType === "RESOLVED") {
      params.set("isResolved", "true");
    } else {
      if (filterType !== "all") params.set("type", filterType);
      params.set("isResolved", "false");
    }
    if (filterCategory !== "All") params.set("category", filterCategory);
    return `/api/lost-and-found?${params.toString()}`;
  }, [filterCategory, filterType, page, scope, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const listings = data?.items || [];
  const hasFilters = Boolean(urlSearch) || filterType !== "all" || filterCategory !== "All";

  return (
    <HubLayout
      title="Lost and found"
      description="Lost your ID card, keys or earphones? Post it here. Found something? Help it get home."
      action={{ href: "/lost-and-found/new", label: "Report" }}
    >
      <SegmentedControl<Scope>
        aria-label="Which colleges"
        value={scope}
        onChange={(value) => setParam("scope", value, "MY_CAMPUS")}
        options={[
          { value: "MY_CAMPUS", label: "My college" },
          { value: "ALL", label: "All colleges" },
        ]}
      />

      <div className="flex items-center gap-2">
        <HubSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search ID card, keys, earphones"
          label="Search lost and found"
        />
        <FilterSheet
          title="Filter items"
          groups={[{ key: "category", label: "Category", value: filterCategory, options: CATEGORY_FILTERS }]}
          onChange={(key, value) => setParam(key, value, "All")}
          onClear={() => clearParams(["category"])}
        />
      </div>

      <ChipRow label="Show">
        {TYPE_FILTERS.map((f) => (
          <Chip key={f.id} size="sm" selected={filterType === f.id} onClick={() => setParam("type", f.id)}>
            {f.label}
          </Chip>
        ))}
      </ChipRow>

      <HubResults
        isLoading={isLoading && !data}
        error={error}
        onRetry={() => void mutate()}
        noun="items"
        count={listings.length}
        isValidating={isValidating && Boolean(data)}
        page={data?.page || page}
        totalPages={data?.totalPages || 1}
        empty={{
          icon: PackageSearch,
          title: hasFilters ? "Nothing matches that" : "Nothing reported here",
          description: hasFilters
            ? "Try another word or clear the filters."
            : scope === "MY_CAMPUS"
              ? "No open reports at your college. You can check all colleges too."
              : "No open reports right now.",
          action: hasFilters ? (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery("");
                clearParams(["q", "type", "category"]);
              }}
            >
              Clear search and filters
            </Button>
          ) : scope === "MY_CAMPUS" ? (
            <Button variant="secondary" onClick={() => setParam("scope", "ALL", "MY_CAMPUS")}>
              <Globe className="size-4" aria-hidden="true" />
              Check all colleges
            </Button>
          ) : (
            <Button asChild>
              <Link href="/lost-and-found/new">
                <Plus className="size-4" aria-hidden="true" />
                Report an item
              </Link>
            </Button>
          ),
        }}
      >
        {listings.map((item) => (
          <LostFoundCard key={item.id} item={item} currentUserId={profileId} />
        ))}
      </HubResults>
    </HubLayout>
  );
}
