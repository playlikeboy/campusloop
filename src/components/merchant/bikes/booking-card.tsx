"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/lib/utils";
import { rupees, shortDateTime } from "../merchant-utils";
import { StatusBadge } from "../status-badge";

interface BookingCardProps {
  booking: any;
  busy?: boolean;
  onStatus: (booking: any, status: string) => void;
  onReject: (booking: any) => void;
}

/** One bike booking with its single next step. Handover and return happen on the detail page. */
export function BookingCard({ booking, busy, onStatus, onReject }: BookingCardProps) {
  const detail = `/merchant-portal/bikes/bookings/${booking.id}`;
  const s = booking.status;

  return (
    <article
      aria-label={`Booking ${booking.bookingNumber}`}
      className="space-y-3 rounded-lg border border-border bg-surface p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold text-fg">#{booking.bookingNumber}</h3>
            <StatusBadge kind="booking" status={s} />
          </div>
          <p className="truncate text-sm text-fg-muted">
            {booking.bike?.name}
            {booking.bike?.registrationNumber ? ` · ${booking.bike.registrationNumber}` : ""} ·{" "}
            {formatTimeAgo(booking.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-fg">{rupees(booking.totalAmount)}</p>
          <p className="text-sm text-fg-muted">Deposit {rupees(booking.depositAmount)}</p>
        </div>
      </header>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-fg-muted">When</dt>
          <dd className="text-fg">
            {shortDateTime(booking.startAt)} to {shortDateTime(booking.endAt)}
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Rider</dt>
          <dd className="flex flex-wrap items-center gap-x-2 text-fg">
            <span>{booking.student?.displayName || "Student"}</span>
            {booking.customerPhone && (
              <a
                href={`tel:${booking.customerPhone}`}
                className="inline-flex items-center gap-1 text-brand-text underline-offset-4 hover:underline"
              >
                <Phone className="size-3.5" />
                {booking.customerPhone}
              </a>
            )}
          </dd>
        </div>
      </dl>

      <footer className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="link">
          <Link href={detail}>See details</Link>
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {s === "REQUESTED" && (
            <>
              <Button
                variant="ghost"
                className="text-danger"
                disabled={busy}
                onClick={() => onReject(booking)}
              >
                Reject
              </Button>
              <Button loading={busy} onClick={() => onStatus(booking, "CONFIRMED")}>
                Approve
              </Button>
            </>
          )}
          {s === "CONFIRMED" && (
            <Button loading={busy} onClick={() => onStatus(booking, "READY_FOR_PICKUP")}>
              Bike is ready
            </Button>
          )}
          {s === "READY_FOR_PICKUP" && (
            <Button asChild>
              <Link href={detail}>Hand over keys</Link>
            </Button>
          )}
          {s === "ACTIVE" && (
            <Button asChild>
              <Link href={detail}>Check returned bike</Link>
            </Button>
          )}
          {s === "RETURNED" && (
            <Button loading={busy} onClick={() => onStatus(booking, "COMPLETED")}>
              Finish and return deposit
            </Button>
          )}
        </div>
      </footer>
    </article>
  );
}
