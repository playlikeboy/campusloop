import { Tag } from "lucide-react";
import Link from "next/link";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export interface StoreRowData {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  logoUrl?: string | null;
  isOpen?: boolean;
  rating?: number | string | null;
  estimatedPrepTime?: string | null;
  locationPin?: string | null;
  isDeliveryEnabled?: boolean;
  deliveryFee?: number | null;
  isPickupEnabled?: boolean;
  offers?: Array<{ title: string }>;
}

/** One store in a list: photo, name, one plain meta line and its first offer. No rating here: list data has no real review count. */
export function StoreRow({ store }: { store: StoreRowData }) {
  const image = store.coverUrl || store.logoUrl;
  const meta = [
    store.estimatedPrepTime,
    store.locationPin,
    store.isDeliveryEnabled ? `Delivery ₹${store.deliveryFee ?? 0}` : null,
    store.isPickupEnabled ? "Pickup" : null,
  ].filter(Boolean);

  return (
    <li>
      <Link
        href={`/marketplace/store/${store.id}`}
        onClick={() => {
          sounds.tap();
          haptics.light();
        }}
        className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative size-18 shrink-0 overflow-hidden rounded-md bg-surface-muted sm:size-20">
          {image && <img src={image} alt="" className="size-full object-cover" loading="lazy" />}
          {store.isOpen === false && (
            <span className="absolute inset-0 flex items-center justify-center bg-fg/70 text-xs font-semibold text-bg">
              Closed
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-sans text-base font-semibold text-fg group-hover:text-brand-text">
              {store.name}
            </h3>
          </div>
          {store.description && <p className="truncate text-sm text-fg-muted">{store.description}</p>}
          {meta.length > 0 && <p className="mt-0.5 truncate text-sm text-fg-muted">{meta.join(" · ")}</p>}
          {store.offers && store.offers.length > 0 && (
            <p className="mt-1 inline-flex max-w-full items-center gap-1 text-sm font-medium text-fg">
              <Tag className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{store.offers[0].title}</span>
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
