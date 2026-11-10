"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMarketplaceCart } from "@/hooks/use-marketplace-cart";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { QuantityStepper } from "./quantity-stepper";

export interface MarketplaceProduct {
  id: string;
  merchantId: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  isVeg?: boolean | null;
  storeName?: string;
  storeSlug?: string;
  storeLogo?: string | null;
  merchantName?: string;
  merchantSlug?: string;
  deliveryFee?: number | null;
}

/** Indian veg / non-veg mark: a square with a dot. */
export function VegMark({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      role="img"
      aria-label={isVeg ? "Veg" : "Non-veg"}
      className={cn(
        "inline-flex size-3.5 shrink-0 items-center justify-center rounded-xs border-2",
        isVeg ? "border-success" : "border-danger"
      )}
    >
      <span className={cn("size-1.5 rounded-full", isVeg ? "bg-success" : "bg-danger")} />
    </span>
  );
}

interface ProductRowProps {
  product: MarketplaceProduct;
  /** Show the store name under the product (lists that mix stores). */
  showStore?: boolean;
  /** Delivery fee for this store, when known. */
  deliveryFee?: number;
  addLabel?: string;
}

/** One product with a price and an Add button that turns into a quantity stepper once it is in the cart. */
export function ProductRow({ product, showStore, deliveryFee, addLabel = "Add" }: ProductRowProps) {
  const { items, addItem, updateQuantity } = useMarketplaceCart();
  const inCart = items.find((i) => i.productId === product.id);
  const storeName = product.storeName || product.merchantName || "Store";

  function add() {
    sounds.tap();
    haptics.light();
    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      merchantName: storeName,
      merchantSlug: product.storeSlug || product.merchantSlug || product.merchantId,
      merchantLogo: product.storeLogo,
      deliveryFee: deliveryFee ?? product.deliveryFee ?? 15,
      productName: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
    });
  }

  return (
    <li className="flex items-center gap-3 py-3">
      {product.imageUrl && (
        <div className="size-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
          <img src={product.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {product.isVeg != null && <VegMark isVeg={!!product.isVeg} />}
          <h3 className="truncate font-sans text-sm font-semibold text-fg">{product.name}</h3>
        </div>
        {product.description && <p className="line-clamp-1 text-sm text-fg-muted">{product.description}</p>}
        {showStore && (
          <Link
            href={`/marketplace/store/${product.merchantId}`}
            className="text-xs text-fg-muted hover:underline"
          >
            {storeName}
          </Link>
        )}
        <p className="mt-0.5 flex items-baseline gap-1.5 tabular-nums">
          <span className="text-sm font-semibold text-fg">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price ? (
            <span className="text-xs text-fg-subtle line-through">₹{product.originalPrice}</span>
          ) : null}
        </p>
      </div>
      {inCart ? (
        <QuantityStepper
          value={inCart.quantity}
          label={product.name}
          onChange={(d) => updateQuantity(inCart.id, d)}
        />
      ) : (
        <Button variant="outline" onClick={add} aria-label={`${addLabel} ${product.name}`}>
          {addLabel}
        </Button>
      )}
    </li>
  );
}
