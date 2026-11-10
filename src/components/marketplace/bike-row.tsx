import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export interface BikeRowData {
  id: string;
  name: string;
  imageUrl?: string | null;
  pickupLocation?: string | null;
  dailyPrice?: number | string | null;
  hourlyPrice?: number | string | null;
  status?: string | null;
  fuelType?: string | null;
  rating?: number | string | null;
  securityDeposit?: number | string | null;
  merchant?: { name?: string | null } | null;
}

/** One rental bike in a list. */
export function BikeRow({ bike }: { bike: BikeRowData }) {
  return (
    <li>
      <Link
        href={`/marketplace/rentals/bikes/${bike.id}`}
        className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="size-20 shrink-0 overflow-hidden rounded-md bg-surface-muted">
          {bike.imageUrl && (
            <img src={bike.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-sans text-base font-semibold text-fg group-hover:text-brand-text">
              {bike.name}
            </h3>
            {bike.status && bike.status !== "AVAILABLE" && <Badge variant="neutral">Booked</Badge>}
          </div>
          <p className="truncate text-sm text-fg-muted">
            {bike.pickupLocation}
            {bike.merchant?.name ? ` · ${bike.merchant.name}` : ""}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-fg-muted tabular-nums">
            {bike.hourlyPrice ? (
              <span>
                <span className="font-semibold text-fg">₹{bike.hourlyPrice}</span> an hour ·
              </span>
            ) : null}
            <span>
              <span className="font-semibold text-fg">₹{bike.dailyPrice}</span> a day
            </span>
            {bike.fuelType && <span>· {bike.fuelType === "ELECTRIC" ? "Electric" : "Petrol"}</span>}
            {bike.securityDeposit ? <span>· ₹{bike.securityDeposit} deposit</span> : null}
          </p>
        </div>
      </Link>
    </li>
  );
}
