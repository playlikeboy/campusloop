"use client";

import { CalendarCheck2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { BookingCard } from "@/components/merchant/bikes/booking-card";
import { useBookingActions } from "@/components/merchant/bikes/use-booking-actions";
import { LoadError } from "@/components/merchant/load-error";
import { FilterChips } from "@/components/merchant/merchant-filters";
import { MerchantListSkeleton, MerchantPage } from "@/components/merchant/merchant-page";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher } from "@/lib/api";

const TABS = [
  { id: "pending", label: "Waiting for you" },
  { id: "confirmed", label: "Approved" },
  { id: "active", label: "On a ride" },
  { id: "completed", label: "Done" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function MerchantBikeBookingsClient() {
  const [tab, setTab] = useState<TabId>("pending");
  const { data, error, isLoading, mutate } = useSWR<{ bookings: any[] }>(
    `/api/merchant/bikes/bookings?filter=${tab}`,
    fetcher,
    { refreshInterval: 5000, refreshWhenHidden: false, refreshWhenOffline: false }
  );
  const { busyId, setStatus, reject, rejectDialog } = useBookingActions(mutate);
  const bookings = data?.bookings || [];

  return (
    <MerchantPage
      title="Bookings"
      description="Approve requests, hand over bikes and check them back in."
      toolbar={<FilterChips label="Booking status" tabs={TABS} value={tab} onChange={setTab} />}
    >
      {isLoading ? (
        <MerchantListSkeleton rows={2} rowClassName="h-40" />
      ) : error ? (
        <LoadError what="your bookings" onRetry={mutate} />
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              busy={busyId === b.id}
              onStatus={(booking, status) => void setStatus(booking, status)}
              onReject={reject}
            />
          ))}
        </div>
      ) : (
        <EmptyState bordered icon={CalendarCheck2} title="No bookings here" description="Try another tab." />
      )}
      {rejectDialog}
    </MerchantPage>
  );
}
