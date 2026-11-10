"use client";

import { Bike, Fuel, Receipt, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { BikeRow, type BikeRowData } from "@/components/marketplace/bike-row";
import { MarketplaceLaunchNotice } from "@/components/marketplace/launch-notice";
import { SearchInput } from "@/components/marketplace/search-input";
import { buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface BikeRentalsClientProps {
  profileId: string;
  collegeName?: string;
}

const FUEL = [
  { id: "all", label: "All" },
  { id: "ELECTRIC", label: "Electric", icon: Zap },
  { id: "PETROL", label: "Petrol and cycles", icon: Fuel },
] as const;

type RentalBike = BikeRowData & { merchantId?: string; model?: string | null; status?: string | null };

function press() {
  sounds.tap();
  haptics.light();
}

export function BikeRentalsClient({ collegeName }: BikeRentalsClientProps) {
  const [fuel, setFuel] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [hub, setHub] = useState<string>("all");

  const { data: storesData } = useSWR<{ stores: Array<{ id: string; name: string }> }>(
    "/api/marketplace/stores?category=rentals",
    fetcher,
    { dedupingInterval: 10000 }
  );
  const {
    data: bikesData,
    isLoading,
    error,
  } = useSWR<{ bikes: RentalBike[] }>(
    `/api/marketplace/rentals/bikes${fuel !== "all" ? `?fuelType=${fuel}` : ""}`,
    fetcher,
    { dedupingInterval: 6000 }
  );

  const hubs = storesData?.stores || [];
  const bikes = useMemo(() => bikesData?.bikes || [], [bikesData]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bikes
      .filter((b) => {
        if (hub !== "all" && b.merchantId !== hub) return false;
        if (!q) return true;
        return [b.name, b.model, b.pickupLocation, b.merchant?.name].some((v) =>
          v?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.status === "AVAILABLE" && b.status !== "AVAILABLE") return -1;
        if (a.status !== "AVAILABLE" && b.status === "AVAILABLE") return 1;
        return Number(a.hourlyPrice || 0) - Number(b.hourlyPrice || 0);
      });
  }, [bikes, query, hub]);

  const noFleet = !isLoading && !error && bikes.length === 0 && fuel === "all";

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <PageHeader
        title="Bike rentals"
        description="Rent a cycle or scooter by the hour or the day."
        size="md"
        secondaryActions={
          <Link href="/marketplace/orders" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Receipt className="size-4" />
            Your bookings
          </Link>
        }
      />

      <div className="space-y-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search bikes"
          placeholder="Search a model or pickup spot"
        />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {FUEL.map((f) => {
            const Icon = "icon" in f ? f.icon : Bike;
            return (
              <Chip
                key={f.id}
                selected={fuel === f.id}
                icon={<Icon />}
                onClick={() => {
                  press();
                  setFuel(f.id);
                }}
              >
                {f.label}
              </Chip>
            );
          })}
        </div>
        {hubs.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <Chip
              size="sm"
              selected={hub === "all"}
              onClick={() => {
                press();
                setHub("all");
              }}
            >
              All shops
            </Chip>
            {hubs.map((h) => (
              <Chip
                key={h.id}
                size="sm"
                selected={hub === h.id}
                onClick={() => {
                  press();
                  setHub((prev) => (prev === h.id ? "all" : h.id));
                }}
              >
                {h.name}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading bikes">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Bike}
          title="Couldn't load bikes"
          description="Check your internet and pull down to refresh."
        />
      ) : noFleet ? (
        <div className="space-y-4">
          <EmptyState icon={Bike} title="No rental bikes here yet" size="compact" />
          <MarketplaceLaunchNotice collegeName={collegeName} />
        </div>
      ) : shown.length > 0 ? (
        <ul className="-mx-3">
          {shown.map((b) => (
            <BikeRow key={b.id} bike={b} />
          ))}
        </ul>
      ) : (
        <EmptyState
          size="compact"
          icon={Bike}
          title="No bikes match"
          description="Try another filter or clear your search."
        />
      )}
    </div>
  );
}
