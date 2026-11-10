"use client";

import { Bike, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BillSummary } from "@/components/marketplace/bill-summary";
import { StatusTimeline } from "@/components/marketplace/status-timeline";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { formatTimeAgo } from "@/lib/utils";

interface BikeBookingClientProps {
  bookingId: string;
}

const STEPS = [
  { key: "REQUESTED", label: "Requested", desc: "Waiting for the shop to confirm" },
  { key: "CONFIRMED", label: "Confirmed", desc: "The bike is kept for you" },
  { key: "READY_FOR_PICKUP", label: "Ready for pickup", desc: "Go to the pickup spot" },
  { key: "ACTIVE", label: "On your ride", desc: "Ride safe" },
  { key: "RETURNED", label: "Returned", desc: "The shop is checking the bike" },
  { key: "COMPLETED", label: "Done", desc: "Thanks for riding. Deposit status is below." },
];

const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  REQUESTED: { label: "Waiting for shop", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "neutral" },
  READY_FOR_PICKUP: { label: "Ready for pickup", variant: "neutral" },
  ACTIVE: { label: "On your ride", variant: "neutral" },
  RETURNED: { label: "Returned", variant: "neutral" },
  COMPLETED: { label: "Done", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
  REJECTED: { label: "Rejected by shop", variant: "danger" },
  DISPUTED: { label: "Deposit in dispute", variant: "warning" },
};

const REFUND: Record<string, string> = {
  REFUNDED: "Refunded",
  DISPUTED: "In dispute",
  PENDING: "Not refunded yet",
  HELD: "Held by the shop",
};

const when = (d: string) =>
  new Date(d).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function BikeBookingClient({ bookingId }: BikeBookingClientProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data, isLoading, error, mutate } = useSWR<{ booking: any }>(
    `/api/marketplace/rentals/bookings/${bookingId}`,
    fetcher,
    { refreshInterval: 5000 }
  );
  const booking = data?.booking;

  async function cancel() {
    sounds.tap();
    haptics.light();
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/marketplace/rentals/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL", reason: "Student requested cancellation" }),
      });
      if (!res.ok) throw new Error("Couldn't cancel. Try again, or call the shop.");
      await mutate();
      toast.success("Booking cancelled.");
      setConfirmCancel(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't cancel. Try again, or call the shop.");
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4" aria-busy="true" aria-label="Loading booking">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!booking) {
    return (
      <EmptyState
        icon={Bike}
        title={error ? "Couldn't load this booking" : "Booking not found"}
        description={error ? "Check your internet and try again." : "The link may be wrong."}
        action={
          <Link href="/marketplace/rentals" className={buttonVariants({ variant: "primary" })}>
            See bikes
          </Link>
        }
      />
    );
  }

  const status = STATUS[booking.status] ?? { label: booking.status, variant: "neutral" as BadgeVariant };
  const isCancelled = ["CANCELLED", "REJECTED", "DISPUTED"].includes(booking.status);
  const canCancel = booking.status === "REQUESTED" || booking.status === "CONFIRMED";

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <PageHeader
        title={`Booking #${booking.bookingNumber}`}
        description={`${booking.bike?.name ?? "Bike"} · ${formatTimeAgo(booking.createdAt)}`}
        backHref="/marketplace/rentals"
        backLabel="Back to bikes"
        size="md"
        secondaryActions={<Badge variant={status.variant}>{status.label}</Badge>}
      />

      <section aria-label="Booking progress" className="rounded-lg border border-border bg-surface p-4">
        {isCancelled ? (
          <div className="space-y-1">
            <p className="text-base font-semibold text-fg">{status.label}</p>
            {booking.cancellationReason && (
              <p className="text-sm text-fg-muted">Reason: {booking.cancellationReason}</p>
            )}
          </div>
        ) : (
          <StatusTimeline steps={STEPS} current={booking.status} />
        )}
      </section>

      <section
        aria-labelledby="booking-when"
        className="space-y-3 rounded-lg border border-border bg-surface p-4 text-sm"
      >
        <h2 id="booking-when" className="font-sans text-base font-semibold text-fg">
          Pickup and return
        </h2>
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-fg-muted">Pick up</dt>
            <dd className="font-medium text-fg tabular-nums">{when(booking.startAt)}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Return by</dt>
            <dd className="font-medium text-fg tabular-nums">{when(booking.endAt)}</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-fg">
            <MapPin className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
            {booking.bike?.pickupLocation}
          </p>
          {booking.merchant?.phone && (
            <a
              href={`tel:${booking.merchant.phone}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Phone className="size-4" />
              Call shop
            </a>
          )}
        </div>
        {(booking.bike?.registrationNumber || booking.bike?.model) && (
          <p className="text-fg-muted">
            {[booking.bike?.model, booking.bike?.registrationNumber].filter(Boolean).join(" · ")}
          </p>
        )}
      </section>

      <BillSummary
        lines={[
          { label: "Rent", amount: Number(booking.rentalAmount || 0) },
          { label: "Deposit, you get it back", amount: Number(booking.depositAmount || 0) },
        ]}
        total={Number(booking.totalAmount || 0)}
        totalLabel={`Total · ${booking.paymentMethod === "UPI" ? "UPI" : "Cash"}`}
      />
      {booking.depositRefundStatus && (
        <p className="text-sm text-fg-muted">
          Deposit: {REFUND[booking.depositRefundStatus] ?? booking.depositRefundStatus.toLowerCase()}
        </p>
      )}

      {canCancel && (
        <Button variant="outline" className="w-full" onClick={() => setConfirmCancel(true)}>
          Cancel booking
        </Button>
      )}

      <ConfirmDialog
        isOpen={confirmCancel}
        title="Cancel this booking?"
        description="The shop will free up the bike for someone else."
        confirmText="Cancel booking"
        cancelText="Keep booking"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={cancel}
        onClose={() => setConfirmCancel(false)}
      />
    </div>
  );
}
