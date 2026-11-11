"use client";

import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { LoadError } from "@/components/merchant/load-error";
import {
  MerchantListSkeleton,
  MerchantPage,
  MerchantSectionTitle,
} from "@/components/merchant/merchant-page";
import { shortTime } from "@/components/merchant/merchant-utils";
import { StatList } from "@/components/merchant/stat-list";
import { StatusBadge } from "@/components/merchant/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher } from "@/lib/api";

interface BikeDashboard {
  merchant: { name?: string };
  fleetSummary: {
    totalVehicles: number;
    availableCount: number;
    rentedCount: number;
    maintenanceCount: number;
  };
  todaysBookings: any[];
}

export function MerchantBikeDashboardClient() {
  const { data, error, isLoading, mutate } = useSWR<BikeDashboard>("/api/merchant/bikes", fetcher, {
    refreshInterval: 6000,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });
  const stats = data?.fleetSummary;
  const today = data?.todaysBookings || [];

  const addBike = (
    <Button asChild>
      <Link href="/merchant-portal/bikes/fleet/new">
        <Plus />
        Add a bike
      </Link>
    </Button>
  );

  return (
    <MerchantPage
      title={data?.merchant?.name || "Bike rentals"}
      description="Today at a glance."
      primaryAction={addBike}
    >
      {isLoading ? (
        <MerchantListSkeleton rows={3} />
      ) : error || !data ? (
        <LoadError what="your rentals" onRetry={mutate} />
      ) : (
        <>
          <StatList
            items={[
              { label: "Bikes", value: stats?.totalVehicles ?? 0 },
              { label: "Available", value: stats?.availableCount ?? 0 },
              { label: "Rented out", value: stats?.rentedCount ?? 0 },
              {
                label: "In repair",
                value: stats?.maintenanceCount ?? 0,
                attention: (stats?.maintenanceCount ?? 0) > 0,
              },
            ]}
          />

          <section className="space-y-3">
            <MerchantSectionTitle
              action={
                <Button asChild variant="link">
                  <Link href="/merchant-portal/bikes/bookings">All bookings</Link>
                </Button>
              }
            >
              Today's bookings
            </MerchantSectionTitle>
            {today.length > 0 ? (
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
                {today.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/merchant-portal/bikes/bookings/${b.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-fg">
                          #{b.bookingNumber} · {b.bike?.name}
                        </p>
                        <p className="truncate text-sm text-fg-muted">
                          {b.student?.displayName || "Student"} · {shortTime(b.startAt)} to{" "}
                          {shortTime(b.endAt)}
                        </p>
                      </div>
                      <StatusBadge kind="booking" status={b.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                bordered
                size="compact"
                icon={CalendarDays}
                title="No bookings today"
                description="New requests show up in Bookings."
              />
            )}
          </section>
        </>
      )}
    </MerchantPage>
  );
}
