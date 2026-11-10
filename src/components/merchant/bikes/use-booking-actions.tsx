"use client";

import { useState } from "react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { readError } from "../merchant-utils";
import { RejectDialog } from "../reject-dialog";
import { statusLabel } from "../status-badge";

export type BookingRef = { id: string; bookingNumber: string };

/** Booking status changes + reject-with-reason dialog. */
export function useBookingActions(refresh: () => unknown) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<BookingRef | null>(null);

  async function setStatus(booking: BookingRef, status: string, rejectionReason?: string): Promise<boolean> {
    setBusyId(booking.id);
    sounds.send();
    try {
      const res = await fetch(`/api/merchant/bikes/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (!res.ok) throw new Error(await readError(res, "Couldn't update the booking. Try again."));
      haptics.success();
      await refresh();
      toast.success(`Booking #${booking.bookingNumber}: ${statusLabel("booking", status).toLowerCase()}`);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the booking. Try again.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  const rejectDialog = (
    <RejectDialog
      open={Boolean(rejecting)}
      onOpenChange={(open) => !open && setRejecting(null)}
      title={rejecting ? `Reject booking #${rejecting.bookingNumber}?` : "Reject booking?"}
      placeholder="For example: bike is booked for those dates"
      loading={Boolean(rejecting && busyId === rejecting.id)}
      onConfirm={async (reason) => {
        if (rejecting && (await setStatus(rejecting, "REJECTED", reason))) setRejecting(null);
      }}
    />
  );

  return { busyId, setStatus, reject: setRejecting, rejectDialog };
}
