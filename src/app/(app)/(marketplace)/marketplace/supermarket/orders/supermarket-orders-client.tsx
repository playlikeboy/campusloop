"use client";

import { ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo } from "@/lib/utils";

export function SupermarketOrdersClient() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const { data, isLoading } = useSWR<{ orders: any[] }>(
    `/api/marketplace/orders?filter=${filter}&category=essentials`,
    fetcher,
    { refreshInterval: 6000 }
  );

  const orders = (data?.orders || []).filter(
    (o) => o.categorySlug === "essentials" || o.categorySlug === "mart"
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-20 select-none">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/marketplace/supermarket"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className="flex size-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <h1 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
            <ShoppingBag className="size-4.5 text-warning" />
            <span>Supermarket &amp; Mart Orders</span>
          </h1>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
          {(["all", "active", "completed"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                setFilter(tab);
              }}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer",
                filter === tab ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Orders List ─── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => {
            const isPacking = ["ACCEPTED", "PREPARING"].includes(order.status);
            const isPacked = ["READY", "READY_FOR_PICKUP"].includes(order.status);
            const isDispatched = order.status === "OUT_FOR_DELIVERY";
            const isDelivered = ["DELIVERED", "PICKED_UP"].includes(order.status);

            return (
              <Link
                key={order.id}
                href={`/marketplace/order/${order.id}`}
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className="block p-4 rounded-2xl border border-border bg-card hover:border-warning transition-colors shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-xl bg-warning-subtle text-warning flex items-center justify-center font-black">
                      <ShoppingBag className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground">
                        {order.merchant?.name || "Campus Mart"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Order #{order.orderNumber}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold",
                      isPacking && "bg-warning-subtle text-warning border border-warning",
                      isPacked && "bg-brand-subtle text-brand-text border border-brand",
                      isDispatched &&
                        "bg-brand-subtle text-brand-text border border-brand animate-pulse",
                      isDelivered && "bg-success-subtle text-success border border-success",
                      order.status === "REJECTED" && "bg-danger-subtle text-danger border border-danger",
                      order.status === "PLACED" && "bg-muted text-foreground border border-border"
                    )}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Items Summary */}
                <div className="text-xs text-muted-foreground border-y border-border/40 py-2 space-y-0.5">
                  {(order.items || []).map((item: any) => (
                    <p key={item.id} className="truncate">
                      <span className="font-bold text-foreground">{item.quantity}x</span> {item.name}
                    </p>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{formatTimeAgo(new Date(order.createdAt))}</span>
                  <div className="flex items-center gap-1 font-black text-foreground">
                    <span>Total:</span>
                    <span className="text-sm text-warning">₹{order.total}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl border border-dashed border-border bg-card/50 text-center space-y-3">
          <ShoppingBag className="size-10 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No supermarket orders yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Need midnight snacks, instant noodles, or exam notebooks? Get them delivered in 15 minutes.
          </p>
          <Link
            href="/marketplace/supermarket"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-black"
          >
            <span>Shop Campus Mart</span>
          </Link>
        </div>
      )}
    </div>
  );
}
