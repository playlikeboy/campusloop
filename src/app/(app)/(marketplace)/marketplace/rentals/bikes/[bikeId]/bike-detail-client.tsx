"use client";

import { AlertCircle, Bike, CheckCircle2, Fuel, Gauge, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BillSummary } from "@/components/marketplace/bill-summary";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { type BookingDetails, BookingSheet } from "./booking-sheet";

interface BikeDetailClientProps {
  bikeId: string;
  profileId: string;
}

function localInput(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  // datetime-local wants local time; toISOString() would shift it to UTC.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BikeDetailClient({ bikeId }: BikeDetailClientProps) {
  const router = useRouter();
  const [startDateTime, setStartDateTime] = useState(() => localInput(1));
  const [endDateTime, setEndDateTime] = useState(() => localInput(3));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error } = useSWR<{
    bike: any;
    availability: {
      isAvailableForDates: boolean;
      overlapReason: string | null;
      rentalDays: number;
      rentalAmount: number;
      depositAmount: number;
      totalPayable: number;
    };
  }>(
    `/api/marketplace/rentals/bikes/${bikeId}?startAt=${encodeURIComponent(startDateTime)}&endAt=${encodeURIComponent(endDateTime)}`,
    fetcher,
    { dedupingInterval: 5000 }
  );

  const bike = data?.bike;
  const availability = data?.availability;

  async function book(details: BookingDetails) {
    sounds.send();
    haptics.success();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/marketplace/rentals/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bikeId,
          startAt: new Date(startDateTime).toISOString(),
          endAt: new Date(endDateTime).toISOString(),
          ...details,
        }),
      });
      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData?.error || "Couldn't send your booking. Try again.");
      }
      const resData = (await res.json()) as { bookingId: string };
      toast.success("Booking request sent.");
      router.push(`/marketplace/rentals/booking/${resData.bookingId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't send your booking. Check your internet and try again."
      );
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4" aria-busy="true" aria-label="Loading bike">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!bike) {
    return (
      <EmptyState
        icon={Bike}
        title={error ? "Couldn't load this bike" : "Bike not found"}
        description={error ? "Check your internet and try again." : "It may have been removed by the shop."}
        action={
          <Link href="/marketplace/rentals" className={buttonVariants({ variant: "primary" })}>
            See all bikes
          </Link>
        }
      />
    );
  }

  const deposit = Number(bike.securityDeposit || 0);
  const rental = availability?.rentalAmount ?? Number(bike.dailyPrice || 0);
  const total = availability?.totalPayable ?? rental + deposit;
  const canBook = !!availability?.isAvailableForDates;

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <PageHeader
        title={bike.name}
        backHref="/marketplace/rentals"
        backLabel="Back to bikes"
        size="md"
        divider={false}
      />

      {bike.imageUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-surface-muted">
          <img src={bike.imageUrl} alt={bike.name} className="size-full object-cover" />
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          {bike.status && bike.status !== "AVAILABLE" && <Badge variant="neutral">Booked right now</Badge>}
          {bike.registrationNumber && <span className="font-mono text-xs">{bike.registrationNumber}</span>}
        </div>
        <p className="flex items-center gap-1.5 text-sm text-fg">
          <MapPin className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
          Pick up at {bike.pickupLocation}
          {bike.merchant?.name ? ` · ${bike.merchant.name}` : ""}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
          {bike.fuelType && (
            <span className="inline-flex items-center gap-1.5">
              <Fuel className="size-4" aria-hidden="true" />
              {bike.fuelType === "ELECTRIC" ? "Electric" : "Petrol"}
            </span>
          )}
          {bike.specs?.mileage && (
            <span className="inline-flex items-center gap-1.5">
              <Gauge className="size-4" aria-hidden="true" />
              {bike.specs.mileage}
            </span>
          )}
        </p>
      </div>

      <section
        aria-labelledby="rent-dates"
        className="space-y-3 rounded-lg border border-border bg-surface p-4"
      >
        <h2 id="rent-dates" className="font-sans text-base font-semibold text-fg">
          When do you need it?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rent-start">Pick up</Label>
            <Input
              id="rent-start"
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rent-end">Return</Label>
            <Input
              id="rent-end"
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
            />
          </div>
        </div>
        {availability && (
          <p
            role="status"
            className={cn(
              "flex items-center gap-2 rounded-md p-3 text-sm",
              availability.isAvailableForDates ? "bg-success-subtle text-fg" : "bg-danger-subtle text-fg"
            )}
          >
            {availability.isAvailableForDates ? (
              <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-danger" aria-hidden="true" />
            )}
            {availability.isAvailableForDates
              ? `Free for these dates (${availability.rentalDays} ${availability.rentalDays === 1 ? "day" : "days"}).`
              : availability.overlapReason || "Already booked for these dates. Pick other dates."}
          </p>
        )}
      </section>

      <BillSummary
        lines={[
          {
            label: `Rent (${availability?.rentalDays || 1} × ₹${bike.dailyPrice} a day)`,
            amount: rental,
          },
          { label: "Deposit, you get it back on return", amount: deposit },
        ]}
        total={total}
        totalLabel="Pay at pickup"
      />

      <Button
        size="lg"
        className="w-full"
        disabled={!canBook}
        onClick={() => {
          sounds.tap();
          haptics.light();
          setSheetOpen(true);
        }}
      >
        {canBook ? "Book this bike" : "Not free for these dates"}
      </Button>

      <BookingSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        total={total}
        submitting={isSubmitting}
        onSubmit={book}
      />
    </div>
  );
}
