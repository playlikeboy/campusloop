"use client";

import { AlertTriangle, Bike, CalendarX, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { HandoverDialog, ReturnDialog } from "@/components/merchant/bikes/inspection-dialogs";
import { useBookingActions } from "@/components/merchant/bikes/use-booking-actions";
import { LoadError } from "@/components/merchant/load-error";
import { MerchantListSkeleton, MerchantPage } from "@/components/merchant/merchant-page";
import { rupees, shortDateTime, shortTime } from "@/components/merchant/merchant-utils";
import { paymentLabel } from "@/components/merchant/orders/order-types";
import { StatusBadge } from "@/components/merchant/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";

interface MerchantBikeBookingDetailClientProps {
  bookingId: string;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-2 text-sm">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-right text-fg">{children}</dd>
    </div>
  );
}

export function MerchantBikeBookingDetailClient({ bookingId }: MerchantBikeBookingDetailClientProps) {
  const [now] = useState(() => Date.now());
  const [dialog, setDialog] = useState<"handover" | "return" | null>(null);
  const { data, error, isLoading, mutate } = useSWR<{ booking: any }>(
    `/api/marketplace/rentals/bookings/${bookingId}`,
    fetcher,
    {
      refreshInterval: 5000,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
    }
  );
  const { busyId, setStatus, reject, rejectDialog } = useBookingActions(mutate);
  const b = data?.booking;
  const back = { backHref: "/merchant-portal/bikes/bookings", backLabel: "Back to bookings" };

  if (isLoading) {
    return (
      <MerchantPage width="narrow" title="Booking" {...back}>
        <MerchantListSkeleton rows={3} rowClassName="h-32" />
      </MerchantPage>
    );
  }

  if (!b && error && !/not found/i.test(String(error?.message))) {
    return (
      <MerchantPage width="narrow" title="Booking" {...back}>
        <LoadError what="this booking" onRetry={mutate} />
      </MerchantPage>
    );
  }

  if (!b) {
    return (
      <MerchantPage width="narrow" title="Booking" {...back}>
        <EmptyState
          bordered
          icon={CalendarX}
          title="Booking not found"
          description="It may have been cancelled."
          action={
            <Button asChild variant="outline">
              <Link href="/merchant-portal/bikes/bookings">See all bookings</Link>
            </Button>
          }
        />
      </MerchantPage>
    );
  }

  const end = new Date(b.endAt).getTime();
  const lateHours = b.status === "ACTIVE" && now > end ? Math.ceil((now - end) / 3_600_000) : 0;
  const busy = busyId === b.id;

  return (
    <MerchantPage
      width="narrow"
      title={`Booking #${b.bookingNumber}`}
      description={`${b.bike?.name ?? "Bike"} · booked ${formatTimeAgo(b.createdAt)}`}
      secondaryActions={<StatusBadge kind="booking" status={b.status} />}
      {...back}
    >
      {lateHours > 0 && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-md bg-danger-subtle px-4 py-3 text-sm font-semibold text-danger"
        >
          <AlertTriangle className="size-4 shrink-0" />
          {lateHours} hour{lateHours === 1 ? "" : "s"} late. It was due back at {shortTime(b.endAt)}.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-fg">{b.student?.displayName || "Student"}</p>
              {b.hostelAddress && <p className="text-sm text-fg-muted">{b.hostelAddress}</p>}
            </div>
            {b.customerPhone && (
              <Button asChild variant="outline">
                <a href={`tel:${b.customerPhone}`}>
                  <Phone />
                  Call
                </a>
              </Button>
            )}
          </div>
          <dl className="divide-y divide-border border-t border-border">
            <Row label="Driving licence">{b.documents?.drivingLicenseNumber || "Not given"}</Row>
            <Row label="Aadhaar">
              {b.documents?.aadhaarLast4 ? `Ends in ${b.documents.aadhaarLast4}` : "Not given"}
            </Row>
          </dl>
          <p className="text-sm text-fg-muted">Check the licence in person before handing over the keys.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bike and time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted text-fg-subtle">
              {b.bike?.imageUrl ? (
                <img src={b.bike.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <Bike className="size-6" />
              )}
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-fg">{b.bike?.name}</p>
              <p className="text-fg-muted">{b.bike?.registrationNumber}</p>
            </div>
          </div>
          <dl className="divide-y divide-border border-t border-border">
            <Row label="Pickup">{shortDateTime(b.startAt)}</Row>
            <Row label="Return by">{shortDateTime(b.endAt)}</Row>
            {b.bike?.pickupLocation && <Row label="Pickup spot">{b.bike.pickupLocation}</Row>}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <Row label="Rent">{rupees(b.rentalAmount)}</Row>
            <Row label="Deposit (refundable)">{rupees(b.depositAmount)}</Row>
            <Row label={`Total${b.paymentMethod ? ` · ${paymentLabel(b.paymentMethod)}` : ""}`}>
              <span className="font-semibold tabular-nums">{rupees(b.totalAmount)}</span>
            </Row>
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {b.status === "REQUESTED" && (
          <>
            <Button size="lg" loading={busy} onClick={() => void setStatus(b, "CONFIRMED")}>
              Approve
            </Button>
            <Button variant="ghost" className="text-danger" disabled={busy} onClick={() => reject(b)}>
              Reject
            </Button>
          </>
        )}
        {b.status === "CONFIRMED" && (
          <Button size="lg" loading={busy} onClick={() => void setStatus(b, "READY_FOR_PICKUP")}>
            Bike is ready
          </Button>
        )}
        {b.status === "READY_FOR_PICKUP" && (
          <Button size="lg" onClick={() => setDialog("handover")}>
            Hand over keys
          </Button>
        )}
        {b.status === "ACTIVE" && (
          <Button size="lg" onClick={() => setDialog("return")}>
            Check returned bike
          </Button>
        )}
        {b.status === "RETURNED" && (
          <Button size="lg" loading={busy} onClick={() => void setStatus(b, "COMPLETED")}>
            Finish and return deposit
          </Button>
        )}
      </div>

      <HandoverDialog
        open={dialog === "handover"}
        bookingId={b.id}
        onClose={() => setDialog(null)}
        onDone={mutate}
      />
      <ReturnDialog
        open={dialog === "return"}
        bookingId={b.id}
        deposit={b.depositAmount}
        onClose={() => setDialog(null)}
        onDone={mutate}
      />
      {rejectDialog}
    </MerchantPage>
  );
}
