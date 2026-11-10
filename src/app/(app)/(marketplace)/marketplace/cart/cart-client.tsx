"use client";

import { ChevronRight, Info, ShoppingCart, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BillSummary } from "@/components/marketplace/bill-summary";
import { QuantityStepper } from "@/components/marketplace/quantity-stepper";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplaceCart } from "@/hooks/use-marketplace-cart";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export function CartClient() {
  const { items, isLoaded, updateQuantity, clearCart, merchantGroups, overallSubtotal, isMultiMerchant } =
    useMarketplaceCart();
  const [confirmClear, setConfirmClear] = useState(false);

  const deliveryFee = merchantGroups.reduce((sum, g) => sum + g.finalDeliveryFee, 0);
  const grandTotal = overallSubtotal + deliveryFee;

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-2xl space-y-3" aria-busy="true" aria-label="Loading cart">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Your cart" backHref="/marketplace" size="md" divider={false} />
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add something from a store to see it here."
          action={
            <Link href="/marketplace" className={buttonVariants({ variant: "primary" })}>
              Browse stores
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <PageHeader
        title="Your cart"
        backHref="/marketplace"
        size="md"
        divider={false}
        secondaryActions={
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
            Clear cart
          </Button>
        }
      />

      {isMultiMerchant && (
        <p className="flex items-start gap-2 rounded-lg bg-surface-muted p-3 text-sm text-fg-muted">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Your cart has items from {merchantGroups.length} stores, so you&apos;ll place{" "}
          {merchantGroups.length} separate orders.
        </p>
      )}

      {merchantGroups.map((group) => (
        <section
          key={group.merchantId}
          aria-label={group.merchantName}
          className="rounded-lg border border-border bg-surface"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Link
              href={`/marketplace/store/${group.merchantId}`}
              className="flex items-center gap-2 text-sm font-semibold text-fg hover:underline"
            >
              <Store className="size-4 text-fg-muted" aria-hidden="true" />
              {group.merchantName}
            </Link>
            <span className="text-sm text-fg-muted tabular-nums">
              ₹{group.subtotal.toLocaleString("en-IN")}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {group.items.map((item) => {
              const addons = (item.selectedAddons || []).reduce((sum, a) => sum + a.price, 0);
              const lineTotal = (item.price + addons) * item.quantity;
              const options = item.selectedOptions ? Object.entries(item.selectedOptions) : [];
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{item.productName}</p>
                    {options.length > 0 && (
                      <p className="text-xs text-fg-muted">
                        {options.map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <p className="text-xs text-fg-muted">
                        + {item.selectedAddons.map((a) => a.name).join(", ")}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm font-semibold text-fg tabular-nums">
                      ₹{lineTotal.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <QuantityStepper
                    value={item.quantity}
                    label={item.productName}
                    onChange={(d) => updateQuantity(item.id, d)}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <BillSummary
        lines={[
          { label: "Items", amount: overallSubtotal },
          { label: "Delivery", amount: deliveryFee, freeWhenZero: true },
        ]}
        total={grandTotal}
      />

      <Link
        href="/marketplace/checkout"
        onClick={() => {
          sounds.tap();
          haptics.light();
        }}
        className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full justify-between")}
      >
        <span>Go to checkout</span>
        <span className="flex items-center gap-1 tabular-nums">
          ₹{grandTotal.toLocaleString("en-IN")}
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </Link>

      <ConfirmDialog
        isOpen={confirmClear}
        title="Clear your cart?"
        description="This removes every item from your cart."
        confirmText="Clear cart"
        cancelText="Keep items"
        variant="danger"
        onConfirm={() => {
          clearCart();
          setConfirmClear(false);
        }}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}
