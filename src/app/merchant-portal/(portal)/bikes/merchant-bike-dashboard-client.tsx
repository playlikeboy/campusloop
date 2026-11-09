"use client";

import { Bike, Calendar, CalendarCheck2, Clock, Gauge, Plus } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export function MerchantBikeDashboardClient() {
  const { data, isLoading } = useSWR<{
    merchant: any;
    stats: {
      totalBikes: number;
      availableCount: number;
      rentedCount: number;
      maintenanceCount: number;
      bookedCount: number;
    };
    todaysBookings: any[];
  }>("/api/merchant/bikes", fetcher, { refreshInterval: 6000 });

  const merchant = data?.merchant;
  const stats = data?.stats || {
    totalBikes: 0,
    availableCount: 0,
    rentedCount: 0,
    maintenanceCount: 0,
    bookedCount: 0,
  };
  const todaysBookings = data?.todaysBookings || [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Skeleton className="h-28 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-6 select-none pb-24">
      {/* ─── Header & Add Bike Action ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/40 p-5 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Bike className="size-5 text-success" />
            <span>Bike Rental Management</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {merchant?.name} · Operational Fleet Overview
          </p>
        </div>

        <Link
          href="/merchant-portal/bikes/fleet/new"
          onClick={() => {
            sounds.tap();
            haptics.light();
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity shadow-xs cursor-pointer w-fit"
        >
          <Plus className="size-3.5 stroke-3" />
          <span>Add New Bike</span>
        </Link>
      </div>

      {/* ─── Top Operational Status Counters (PRD Item 7) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-success-subtle border border-success/25 space-y-1 shadow-2xs">
          <p className="text-[11px] font-bold text-success flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" />
            <span>Available</span>
          </p>
          <p className="text-2xl font-bold text-success">{stats.availableCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-warning-subtle border border-warning/25 space-y-1 shadow-2xs">
          <p className="text-[11px] font-bold text-warning flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-warning" />
            <span>Rented Out</span>
          </p>
          <p className="text-2xl font-bold text-warning">{stats.rentedCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-danger-subtle border border-danger/25 space-y-1 shadow-2xs">
          <p className="text-[11px] font-bold text-danger flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-danger" />
            <span>Maintenance</span>
          </p>
          <p className="text-2xl font-bold text-danger">{stats.maintenanceCount}</p>
        </div>
      </div>

      {/* ─── Today's Bookings ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-4 text-primary" />
            <span>Today's Bookings ({todaysBookings.length})</span>
          </h2>

          <Link
            href="/merchant-portal/bikes/bookings"
            className="text-xs font-bold text-primary hover:underline"
          >
            All Bookings →
          </Link>
        </div>

        {todaysBookings.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {todaysBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/40 text-xs shadow-xs"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">#{b.bookingNumber}</span>
                    <span className="text-muted-foreground">· {b.bike?.name}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Student: {b.student?.displayName} (@{b.student?.username}) · Phone: {b.customerPhone}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Time: {new Date(b.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                    → {new Date(b.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                      b.status === "CONFIRMED" || b.status === "ACTIVE"
                        ? "bg-success-subtle text-success border-success/30"
                        : "bg-warning-subtle text-warning border-warning/30"
                    )}
                  >
                    {b.status}
                  </span>

                  <Link
                    href={`/merchant-portal/bikes/bookings/${b.id}`}
                    className="px-3 py-1.5 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-card border border-border/40 text-center space-y-1">
            <p className="text-sm font-bold text-foreground">No bookings scheduled for today</p>
            <p className="text-xs text-muted-foreground">
              Future student reservations will appear in the bookings pipeline.
            </p>
          </div>
        )}
      </section>

      {/* ─── Quick Actions (PRD Item 7) ─── */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-muted-foreground">Quick Actions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/merchant-portal/bikes/fleet"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="p-4 rounded-2xl bg-card border border-border/40 hover:border-foreground/30 space-y-1 transition-colors cursor-pointer shadow-xs"
          >
            <Gauge className="size-5 text-primary" />
            <p className="text-sm font-bold text-foreground">Manage Fleet</p>
            <p className="text-[11px] text-muted-foreground">
              {stats.totalBikes} vehicles registered in fleet
            </p>
          </Link>

          <Link
            href="/merchant-portal/bikes/bookings"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="p-4 rounded-2xl bg-card border border-border/40 hover:border-foreground/30 space-y-1 transition-colors cursor-pointer shadow-xs"
          >
            <CalendarCheck2 className="size-5 text-success" />
            <p className="text-sm font-bold text-foreground">Bookings Pipeline</p>
            <p className="text-[11px] text-muted-foreground">Approve requests &amp; process returns</p>
          </Link>

          <Link
            href="/merchant-portal/bikes/availability"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="p-4 rounded-2xl bg-card border border-border/40 hover:border-foreground/30 space-y-1 transition-colors cursor-pointer shadow-xs"
          >
            <Clock className="size-5 text-warning" />
            <p className="text-sm font-bold text-foreground">Availability Calendar</p>
            <p className="text-[11px] text-muted-foreground">Block time slots &amp; maintenance</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
