"use client";

import { Building2, Car, Navigation, Plane, Plus, Train, TramFront } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { RideshareCard } from "@/components/communities/rideshare-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fetcher } from "@/lib/api";
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

/** Quick picks write the search box; "all" clears it. */
const DESTINATIONS = [
  { id: "all", label: "Anywhere", icon: Navigation },
  { id: "Airport", label: "Airport", icon: Plane },
  { id: "Station", label: "Railway station", icon: Train },
  { id: "Metro", label: "Metro", icon: TramFront },
  { id: "City", label: "City and malls", icon: Building2 },
] as const;

export function RideshareClient({ profileId }: Props) {
  const { urlSearch, page, searchQuery, setSearchQuery, setParam } = useHubQuery();

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams({ tab: "rideshare", page: String(page), limit: "18" });
    if (urlSearch) params.set("q", urlSearch);
    return `/api/communities/feed?${params.toString()}`;
  }, [page, urlSearch]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<FeedResponse>(requestUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const rides = useMemo(
    () =>
      (data?.items || [])
        .filter((item) => item.itemType === "RIDESHARE" && item.data)
        .map((item) => item.data),
    [data?.items]
  );

  const offerButton = (
    <Button asChild>
      <Link href="/rideshare/new">
        <Plus className="size-4" aria-hidden="true" />
        Offer a ride
      </Link>
    </Button>
  );

  return (
    <HubLayout
      title="Ride share"
      description="Going to the station or airport? Find students headed the same way and split the cab."
      action={{ href: "/rideshare/new", label: "Offer a ride" }}
    >
      <HubSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Where are you going?"
        label="Search rides by destination"
      />

      <ChipRow label="Destination">
        {DESTINATIONS.map((dest) => {
          const Icon = dest.icon;
          const selected =
            dest.id === "all" ? !urlSearch : urlSearch.toLowerCase().includes(dest.id.toLowerCase());
          return (
            <Chip
              key={dest.id}
              size="sm"
              selected={selected}
              icon={<Icon aria-hidden="true" />}
              onClick={() => setParam("q", dest.id)}
            >
              {dest.label}
            </Chip>
          );
        })}
      </ChipRow>

      <HubResults
        isLoading={isLoading && !data}
        error={error}
        onRetry={() => void mutate()}
        noun="rides"
        count={rides.length}
        isValidating={isValidating && Boolean(data)}
        page={data?.page || page}
        totalPages={data?.totalPages || 1}
        skeletonClassName="h-56"
        empty={{
          icon: Car,
          title: urlSearch ? `No rides to "${urlSearch}" yet` : "No rides posted yet",
          description: "Post your trip and others going the same way can join.",
          action: urlSearch ? (
            <div className="flex flex-wrap justify-center gap-2">
              {offerButton}
              <Button variant="secondary" onClick={() => setParam("q", "all")}>
                Show all rides
              </Button>
            </div>
          ) : (
            offerButton
          ),
        }}
      >
        {rides.map((item) => (
          <RideshareCard key={item.id} item={item} currentUserId={profileId} />
        ))}
      </HubResults>
    </HubLayout>
  );
}
