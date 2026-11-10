import { toast } from "sonner";
import { absoluteUrl } from "@/lib/seo/constants";

/** Public storefront page students see. */
export function storePath(merchantId: string): string {
  return `/marketplace/store/${merchantId}`;
}

export function storeUrl(merchantId: string): string {
  return absoluteUrl(storePath(merchantId));
}

/** Copies text and tells the user whether it worked. */
export async function copyText(text: string, successMessage: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Couldn't copy. Long-press the text to copy it yourself.");
  }
}

export function copyStoreLink(merchantId: string): Promise<void> {
  return copyText(storeUrl(merchantId), "Store link copied");
}

export function rupees(value: number | null | undefined): string {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`;
}

export function shortDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/** Value for <input type="datetime-local"> in the user's own time zone. */
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** Reads `{ error }` from a failed JSON response, falling back to a plain message. */
export async function readError(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error || fallback;
}

/** Store vertical decides which nav and dashboard a merchant sees. */
export type MerchantVertical = "food" | "rentals" | "mart";

export function merchantVertical(
  merchant: { categorySlug?: string | null; verticalType?: string | null } | null | undefined,
  pathname = ""
): MerchantVertical {
  const cat = merchant?.categorySlug?.toLowerCase();
  const type = merchant?.verticalType?.toUpperCase();
  if (cat === "rentals" || type === "RENTALS" || pathname.startsWith("/merchant-portal/bikes"))
    return "rentals";
  if (
    cat === "essentials" ||
    type === "MART" ||
    type === "SUPERMARKET" ||
    pathname.startsWith("/merchant-portal/supermarket")
  ) {
    return "mart";
  }
  return "food";
}

export function homePathFor(vertical: MerchantVertical): string {
  if (vertical === "rentals") return "/merchant-portal/bikes";
  if (vertical === "mart") return "/merchant-portal/supermarket";
  return "/merchant-portal";
}
