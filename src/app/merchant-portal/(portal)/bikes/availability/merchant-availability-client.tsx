"use client";

import { Bike, Lock, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BlockDatesDialog } from "@/components/merchant/bikes/block-dates-dialog";
import { LoadError } from "@/components/merchant/load-error";
import { NativeSelect } from "@/components/merchant/merchant-filters";
import {
  MerchantListSkeleton,
  MerchantPage,
  MerchantSectionTitle,
} from "@/components/merchant/merchant-page";
import { shortDateTime } from "@/components/merchant/merchant-utils";
import { StatusBadge, statusLabel } from "@/components/merchant/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { fetcher } from "@/lib/api";
import { sounds } from "@/lib/sounds";

const BLOCK_REASON: Record<string, string> = {
  MAINTENANCE: "Repair or service",
  MERCHANT_BLOCKED: "Not available",
};

export function MerchantAvailabilityClient() {
  const [selectedBikeId, setSelectedBikeId] = useState("");
  const [blockOpen, setBlockOpen] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{
    fleet: any[];
    selectedBikeId: string;
    blocks: any[];
    bookings: any[];
  }>(`/api/merchant/bikes/availability${selectedBikeId ? `?bikeId=${selectedBikeId}` : ""}`, fetcher, {
    keepPreviousData: true,
  });

  const fleet = data?.fleet || [];
  const bikeId = selectedBikeId || data?.selectedBikeId || fleet[0]?.id;
  const bike = fleet.find((b) => b.id === bikeId);
  const blocks = data?.blocks || [];
  const bookings = data?.bookings || [];

  async function removeBlock(id: string) {
    sounds.tap();
    try {
      const res = await fetch(`/api/merchant/bikes/availability?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success("Dates unblocked");
    } catch {
      toast.error("Couldn't unblock. Try again.");
    }
  }

  return (
    <MerchantPage
      title="Availability"
      description="See when each bike is booked, and block dates for repairs."
      primaryAction={
        bike ? (
          <Button onClick={() => setBlockOpen(true)}>
            <Lock />
            Block dates
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <MerchantListSkeleton rows={3} />
      ) : error ? (
        <LoadError what="availability" onRetry={mutate} />
      ) : fleet.length === 0 ? (
        <EmptyState
          bordered
          icon={Bike}
          title="No bikes yet"
          description="Add a bike first, then manage its dates here."
          action={
            <Button asChild>
              <Link href="/merchant-portal/bikes/fleet/new">Add a bike</Link>
            </Button>
          }
        />
      ) : (
        <>
          <FormField label="Bike">
            <NativeSelect value={bikeId} onChange={(e) => setSelectedBikeId(e.target.value)}>
              {fleet.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.registrationNumber}) · {statusLabel("bike", b.status)}
                </option>
              ))}
            </NativeSelect>
          </FormField>

          <section className="space-y-3">
            <MerchantSectionTitle>Bookings</MerchantSectionTitle>
            {bookings.length > 0 ? (
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
                {bookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-fg">
                        #{b.bookingNumber} · {b.student?.displayName || "Student"}
                      </p>
                      <p className="text-fg-muted">
                        {shortDateTime(b.startAt)} to {shortDateTime(b.endAt)}
                      </p>
                    </div>
                    <StatusBadge kind="booking" status={b.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-muted">No bookings for this bike. It's free to book.</p>
            )}
          </section>

          <section className="space-y-3">
            <MerchantSectionTitle>Blocked dates</MerchantSectionTitle>
            {blocks.length > 0 ? (
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
                {blocks.map((block) => (
                  <li
                    key={block.id}
                    className="flex items-center justify-between gap-3 py-2 pr-2 pl-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-fg">
                        {BLOCK_REASON[block.reason] ?? block.reason}
                        {block.notes ? (
                          <span className="font-normal text-fg-muted"> · {block.notes}</span>
                        ) : null}
                      </p>
                      <p className="text-fg-muted">
                        {shortDateTime(block.startAt)} to {shortDateTime(block.endAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Unblock these dates"
                      onClick={() => void removeBlock(block.id)}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-muted">No blocked dates.</p>
            )}
          </section>
        </>
      )}
      <BlockDatesDialog
        open={blockOpen}
        bikeId={bikeId}
        bikeName={bike?.name}
        onClose={() => setBlockOpen(false)}
        onSaved={mutate}
      />
    </MerchantPage>
  );
}
