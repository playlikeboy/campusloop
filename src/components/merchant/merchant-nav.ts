import {
  Bike,
  CalendarCheck2,
  Clock,
  IndianRupee,
  LayoutDashboard,
  type LucideIcon,
  Package,
  QrCode,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import type { MerchantVertical } from "./merchant-utils";

export type MerchantNavItem = { href: string; label: string; icon: LucideIcon };

const FOOD_NAV: MerchantNavItem[] = [
  { href: "/merchant-portal", label: "Home", icon: LayoutDashboard },
  { href: "/merchant-portal/orders", label: "Orders", icon: Package },
  { href: "/merchant-portal/products", label: "Menu", icon: UtensilsCrossed },
  { href: "/merchant-portal/store", label: "Store details", icon: Store },
  { href: "/merchant-portal/offers", label: "Offers", icon: Tag },
  { href: "/merchant-portal/earnings", label: "Earnings", icon: IndianRupee },
  { href: "/merchant-portal/reviews", label: "Reviews", icon: Star },
  { href: "/merchant-portal/store/qr", label: "QR poster", icon: QrCode },
];

const RENTAL_NAV: MerchantNavItem[] = [
  { href: "/merchant-portal/bikes", label: "Home", icon: Bike },
  { href: "/merchant-portal/bikes/bookings", label: "Bookings", icon: CalendarCheck2 },
  { href: "/merchant-portal/bikes/fleet", label: "Your bikes", icon: Bike },
  { href: "/merchant-portal/bikes/availability", label: "Availability", icon: Clock },
  { href: "/merchant-portal/bikes/settings", label: "Rental rules", icon: Settings },
  { href: "/merchant-portal/store", label: "Store details", icon: Store },
  { href: "/merchant-portal/store/qr", label: "QR poster", icon: QrCode },
];

const MART_NAV: MerchantNavItem[] = [
  { href: "/merchant-portal/supermarket", label: "Home", icon: LayoutDashboard },
  { href: "/merchant-portal/orders", label: "Orders", icon: Package },
  { href: "/merchant-portal/products", label: "Items", icon: ShoppingBag },
  { href: "/merchant-portal/store", label: "Store details", icon: Store },
  { href: "/merchant-portal/offers", label: "Offers", icon: Tag },
  { href: "/merchant-portal/earnings", label: "Earnings", icon: IndianRupee },
  { href: "/merchant-portal/store/qr", label: "QR poster", icon: QrCode },
];

export const MERCHANT_NAV: Record<MerchantVertical, MerchantNavItem[]> = {
  food: FOOD_NAV,
  rentals: RENTAL_NAV,
  mart: MART_NAV,
};

const ROOTS = new Set(["/merchant-portal", "/merchant-portal/bikes", "/merchant-portal/supermarket"]);

/** Longest matching href wins, so /store/qr does not also light up /store. */
export function activeMerchantHref(items: MerchantNavItem[], pathname: string): string | undefined {
  let best: string | undefined;
  for (const item of items) {
    const hit = ROOTS.has(item.href)
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (hit && (!best || item.href.length > best.length)) best = item.href;
  }
  return best;
}

export function verticalLabel(vertical: MerchantVertical, verticalType?: string | null): string {
  if (vertical === "rentals") return "Bike rentals";
  if (vertical === "mart") return "Mart";
  const type = verticalType?.toUpperCase();
  if (type === "BARBER") return "Salon";
  if (type === "LAUNDRY") return "Laundry";
  if (type === "WATER") return "Water supply";
  return "Food";
}
