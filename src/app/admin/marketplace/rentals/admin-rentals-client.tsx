"use client";

import { Bike, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo } from "@/lib/utils";

export function AdminRentalsClient() {
  const [activeTab, setActiveTab] = useState<"fleet" | "bookings">("bookings");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR<{
    bikes: any[];
    bookings: any[];
  }>("/api/admin/marketplace/rentals", fetcher);

  const bikes = data?.bikes || [];
  const bookings = data?.bookings || [];

  async function handleResolveDispute(bookingId: string, resolution: "REFUNDED" | "HELD") {
    sounds.tap();
    haptics.light();
    setResolvingId(bookingId);

    try {
      const res = await fetch("/api/admin/marketplace/rentals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          depositRefundStatus: resolution,
          status: "COMPLETED",
        }),
      });

      if (!res.ok) throw new Error();
      mutate();
      toast.success(
        resolution === "REFUNDED" ? "Deposit Refund Released to Student" : "Deposit Held / Paid for Damage"
      );
    } catch {
      toast.error("Couldn't update the dispute. Try again.");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl text-fg">
            <Bike className="size-5 text-fg-muted" aria-hidden />
            <span>Bike rentals</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">Bikes, bookings and deposit disputes.</p>
        </div>

        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            selected={activeTab === "bookings"}
            onClick={() => {
              sounds.tap();
              setActiveTab("bookings");
            }}
          >
            All Bookings ({bookings.length})
          </Chip>

          <Chip
            size="sm"
            selected={activeTab === "fleet"}
            onClick={() => {
              sounds.tap();
              setActiveTab("fleet");
            }}
          >
            Fleet Vehicles ({bikes.length})
          </Chip>
        </div>
      </div>

      {/* ─── Bookings Oversight Table ─── */}
      {activeTab === "bookings" && (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg">Bookings</h2>
            <span className="text-xs text-fg-muted">{bookings.length} reservations recorded</span>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : (
            <div className="divide-y divide-border overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-fg-muted font-bold text-xs">
                  <tr>
                    <th className="p-3">Booking #</th>
                    <th className="p-3">Bike</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">When</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Dispute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-muted transition-colors">
                      <td className="p-3 font-bold text-fg">
                        <span>#{b.bookingNumber}</span>
                        <p className="text-xs text-fg-muted">{formatTimeAgo(b.createdAt)}</p>
                      </td>
                      <td className="p-3 font-bold text-fg">
                        <p>{b.bike?.name}</p>
                        <p className="text-xs text-fg-muted">{b.merchant?.name}</p>
                      </td>
                      <td className="p-3 font-medium">
                        <p className="text-fg font-bold">{b.student?.displayName}</p>
                        <p className="text-xs text-fg-muted inline-flex items-center gap-1">
                          <Phone className="size-2.5" />
                          <span>{b.customerPhone}</span>
                        </p>
                      </td>
                      <td className="p-3 text-fg-muted text-xs">
                        <p>
                          {new Date(b.startAt).toLocaleDateString()}{" "}
                          {new Date(b.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p>
                          → {new Date(b.endAt).toLocaleDateString()}{" "}
                          {new Date(b.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-success">₹{b.totalAmount}</p>
                        <p className="text-xs text-fg-muted">
                          Deposit: ₹{b.depositAmount} ({b.depositRefundStatus})
                        </p>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md font-bold text-xs",
                            b.status === "ACTIVE" || b.status === "CONFIRMED"
                              ? "bg-success-subtle text-success"
                              : b.status === "DISPUTED"
                                ? "bg-danger-subtle text-danger"
                                : "bg-surface-muted text-fg-muted"
                          )}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {b.depositRefundStatus === "DISPUTED" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleResolveDispute(b.id, "REFUNDED")}
                              className={buttonVariants({ variant: "primary", size: "sm" })}
                            >
                              Refund student
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveDispute(b.id, "HELD")}
                              className={buttonVariants({ variant: "danger", size: "sm" })}
                            >
                              Keep deposit
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-fg-muted">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Fleet Oversight Table ─── */}
      {activeTab === "fleet" && (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg">Bikes</h2>
            <span className="text-xs text-fg-muted">{bikes.length} vehicles</span>
          </div>

          <div className="divide-y divide-border overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted text-fg-muted font-bold text-xs">
                <tr>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Number plate</th>
                  <th className="p-3">Store</th>
                  <th className="p-3">Pricing</th>
                  <th className="p-3">Deposit</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bikes.map((bike) => (
                  <tr key={bike.id} className="hover:bg-surface-muted transition-colors">
                    <td className="p-3 font-bold text-fg flex items-center gap-2.5">
                      <div className="size-9 rounded-lg overflow-hidden bg-surface-muted shrink-0 border border-border">
                        <img src={bike.imageUrl} alt={bike.name} className="size-full object-cover" />
                      </div>
                      <div>
                        <p>{bike.name}</p>
                        <p className="text-xs text-fg-muted">{bike.fuelType}</p>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-fg">{bike.registrationNumber}</td>
                    <td className="p-3 text-fg-muted">{bike.merchant?.name}</td>
                    <td className="p-3 font-bold text-fg">₹{bike.dailyPrice}/day</td>
                    <td className="p-3 font-medium text-fg-muted">₹{bike.securityDeposit}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-success-subtle text-success font-bold text-xs">
                        {bike.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
