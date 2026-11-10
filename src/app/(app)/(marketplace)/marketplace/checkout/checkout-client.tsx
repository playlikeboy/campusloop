"use client";

import { CreditCard, ShoppingCart, Store, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BillSummary } from "@/components/marketplace/bill-summary";
import { ChoiceCard } from "@/components/marketplace/choice-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldClassName, Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { useMarketplaceCart } from "@/hooks/use-marketplace-cart";
import { haptics } from "@/lib/haptics";
import { getCampusDeliveryLocations } from "@/lib/marketplace/locations";
import { payWithRazorpay } from "@/lib/payments/razorpay-checkout";
import { sounds } from "@/lib/sounds";

const SAVED_ADDRESS_KEY = "campusloop_saved_delivery_address";

interface CheckoutClientProps {
  profileId: string;
  collegeName?: string;
}

export function CheckoutClient({ profileId, collegeName = "your college" }: CheckoutClientProps) {
  const router = useRouter();
  const { items, merchantGroups, overallSubtotal, clearCart } = useMarketplaceCart();

  const locationGroups = useMemo(() => getCampusDeliveryLocations(collegeName), [collegeName]);
  const defaultHostel = locationGroups[0]?.locations[0]?.label || "";

  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [hostelName, setHostelName] = useState(defaultHostel);
  const [otherLocationDetail, setOtherLocationDetail] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI" | "RAZORPAY">("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autofill delivery address and phone from previous checkout session
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(SAVED_ADDRESS_KEY);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved.hostelName) setHostelName(saved.hostelName);
        if (saved.roomNumber) setRoomNumber(saved.roomNumber);
        if (saved.phone) setPhone(saved.phone);
        if (saved.otherLocationDetail) setOtherLocationDetail(saved.otherLocationDetail);
      }
    } catch {}
  }, []);

  // Autosave delivery address & phone changes to localStorage for next time
  function saveAddressToStorage(hName: string, rNum: string, pNum: string, oLoc: string) {
    try {
      localStorage.setItem(
        SAVED_ADDRESS_KEY,
        JSON.stringify({
          hostelName: hName,
          roomNumber: rNum,
          phone: pNum,
          otherLocationDetail: oLoc,
        })
      );
    } catch {}
  }

  // Rental specific fields if any rental item in cart
  const hasRentalItems = items.some(
    (i) =>
      i.productName.toLowerCase().includes("rental") ||
      i.merchantSlug.includes("rental") ||
      i.merchantSlug.includes("wheels")
  );
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [rentalStartDate, setRentalStartDate] = useState("Today 4:00 PM");

  const totalDeliveryFee =
    fulfillmentType === "DELIVERY" ? merchantGroups.reduce((sum, g) => sum + g.finalDeliveryFee, 0) : 0;

  const grandTotal = overallSubtotal + totalDeliveryFee;

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();

    if (fulfillmentType === "DELIVERY" && !roomNumber.trim()) {
      toast.error("Add your room number so the store knows where to deliver.");
      return;
    }

    if (fulfillmentType === "DELIVERY" && hostelName.includes("Other") && !otherLocationDetail.trim()) {
      toast.error("Tell us the spot or a landmark so the store can find you.");
      return;
    }

    if (!phone.trim()) {
      toast.error("Add your phone number so the store can call you.");
      return;
    }

    if (hasRentalItems && !drivingLicenseNumber.trim()) {
      toast.error("Add your driving licence or student ID number. Rentals need it.");
      return;
    }

    sounds.send();
    haptics.success();
    setIsSubmitting(true);

    try {
      toast.loading("Placing your order...", { id: "checkout" });

      const finalHostelName =
        hostelName.includes("Other") && otherLocationDetail.trim()
          ? `Other: ${otherLocationDetail.trim()}`
          : hostelName;

      const merchantOrders = merchantGroups.map((group) => ({
        merchantId: group.merchantId,
        fulfillmentType,
        customerNote: customerNote.trim() || undefined,
        paymentMethod,
        items: group.items.map((item) => ({
          productId: item.productId,
          merchantId: item.merchantId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          selectedAddons: item.selectedAddons,
        })),
      }));

      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantOrders,
          deliveryAddress: {
            hostelName: fulfillmentType === "DELIVERY" ? finalHostelName : undefined,
            roomNumber: fulfillmentType === "DELIVERY" ? roomNumber.trim() : undefined,
            phone: phone.trim(),
            pickupInstructions: fulfillmentType === "PICKUP" ? "Pickup from main store counter" : undefined,
            rentalStartDate: hasRentalItems ? rentalStartDate : undefined,
            drivingLicenseNumber: hasRentalItems ? drivingLicenseNumber.trim() : undefined,
          },
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData?.error || "Couldn't place your order. Try again.");
      }

      const data = (await res.json()) as { primaryOrderId: string; orderIds: string[] };
      clearCart();

      if (paymentMethod === "RAZORPAY") {
        toast.loading("Opening payment...", { id: "checkout" });
        const result = await payWithRazorpay(data.orderIds, { contact: phone.trim() });
        if (result.status === "paid") {
          toast.success("Paid. Your order is placed.", { id: "checkout" });
        } else if (result.status === "dismissed") {
          toast.info("Payment not finished. You can pay from the order page.", { id: "checkout" });
        } else {
          toast.error(result.message, { id: "checkout" });
        }
      } else {
        toast.success("Order placed.", { id: "checkout" });
      }
      router.push(`/marketplace/order/${data.primaryOrderId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't place your order. Check your internet and try again.",
        {
          id: "checkout",
        }
      );
      setIsSubmitting(false);
    }
  }

  const isBuilding =
    hostelName.includes("Building") ||
    hostelName.includes("PMC") ||
    hostelName.includes("R&D") ||
    hostelName.includes("Library");
  const isOther = hostelName.includes("Other");
  const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Checkout" backHref="/marketplace/cart" size="md" divider={false} />
        <EmptyState
          icon={ShoppingCart}
          title="Nothing to check out"
          description="Your cart is empty. Add something from a store first."
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
    <div className="mx-auto max-w-2xl pb-24">
      <PageHeader
        title="Checkout"
        description={`${collegeName} · ${merchantGroups.length} ${merchantGroups.length === 1 ? "order" : "orders"}`}
        backHref="/marketplace/cart"
        backLabel="Back to cart"
        size="md"
      />

      <form onSubmit={handlePlaceOrder} className="space-y-6 pt-4" noValidate>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-base font-semibold text-fg">How do you want it?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <ChoiceCard
              selected={fulfillmentType === "DELIVERY"}
              onSelect={() => setFulfillmentType("DELIVERY")}
              icon={Truck}
              title="Deliver to me"
              hint="To your hostel or building"
            />
            <ChoiceCard
              selected={fulfillmentType === "PICKUP"}
              onSelect={() => setFulfillmentType("PICKUP")}
              icon={Store}
              title="I'll pick it up"
              hint="Show your order number at the counter"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-base font-semibold text-fg">
            {fulfillmentType === "DELIVERY" ? "Where should it go?" : "Your contact"}
          </legend>

          {fulfillmentType === "DELIVERY" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-hostel" required>
                  Hostel or building
                </Label>
                <select
                  id="checkout-hostel"
                  value={hostelName}
                  onChange={(e) => {
                    setHostelName(e.target.value);
                    saveAddressToStorage(e.target.value, roomNumber, phone, otherLocationDetail);
                  }}
                  className={`${fieldClassName} h-11 cursor-pointer`}
                >
                  {locationGroups.map((grp) => (
                    <optgroup key={grp.groupName} label={grp.groupName}>
                      {grp.locations.map((loc) => (
                        <option key={loc.id} value={loc.label}>
                          {loc.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {isOther && (
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-spot" required>
                    Spot or landmark
                  </Label>
                  <Input
                    id="checkout-spot"
                    required
                    value={otherLocationDetail}
                    onChange={(e) => {
                      setOtherLocationDetail(e.target.value);
                      saveAddressToStorage(hostelName, roomNumber, phone, e.target.value);
                    }}
                    placeholder="Gate 2, sports complex"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="checkout-room" required>
                  {isBuilding ? "Floor, lab or room" : "Room number"}
                </Label>
                <Input
                  id="checkout-room"
                  required
                  value={roomNumber}
                  onChange={(e) => {
                    setRoomNumber(e.target.value);
                    saveAddressToStorage(hostelName, e.target.value, phone, otherLocationDetail);
                  }}
                  placeholder="204"
                  autoComplete="address-line2"
                />
              </div>
            </>
          )}

          {fulfillmentType === "PICKUP" && (
            <p className="text-sm text-fg-muted">
              Your order page shows when it&apos;s ready. Show your order number at the counter.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="checkout-phone" required>
              Phone number
            </Label>
            <Input
              id="checkout-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                saveAddressToStorage(hostelName, roomNumber, e.target.value, otherLocationDetail);
              }}
              placeholder="98765 43210"
            />
          </div>

          {hasRentalItems && (
            <div className="space-y-1.5">
              <Label htmlFor="checkout-licence" required>
                Driving licence or student ID number
              </Label>
              <Input
                id="checkout-licence"
                required
                value={drivingLicenseNumber}
                onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                placeholder="DL-1420110012345"
              />
              <p className="text-xs text-fg-muted">Rentals need this to hand over the vehicle.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="checkout-note">Note for the store (optional)</Label>
            <Input
              id="checkout-note"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Less spicy, call at the gate"
              maxLength={120}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-base font-semibold text-fg">How will you pay?</legend>
          <div className="grid gap-2">
            <ChoiceCard
              selected={paymentMethod === "RAZORPAY"}
              onSelect={() => setPaymentMethod("RAZORPAY")}
              icon={CreditCard}
              title="Pay online now"
              hint="UPI, card or netbanking, through Razorpay"
            />
            <ChoiceCard
              selected={paymentMethod === "COD"}
              onSelect={() => setPaymentMethod("COD")}
              icon={Wallet}
              title={fulfillmentType === "DELIVERY" ? "Cash on delivery" : "Pay at pickup"}
            />
            <ChoiceCard
              selected={paymentMethod === "UPI"}
              onSelect={() => setPaymentMethod("UPI")}
              icon={CreditCard}
              title={fulfillmentType === "DELIVERY" ? "UPI on delivery" : "UPI at pickup"}
              hint="Scan the store's QR code"
            />
          </div>
        </fieldset>

        <BillSummary
          lines={[
            { label: "Items", amount: overallSubtotal },
            { label: "Delivery", amount: totalDeliveryFee, freeWhenZero: true },
          ]}
          total={grandTotal}
        />

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {isSubmitting
            ? paymentMethod === "RAZORPAY"
              ? "Opening payment..."
              : "Placing order..."
            : `${paymentMethod === "RAZORPAY" ? "Pay" : "Place order"} · ${rupees(grandTotal)}`}
        </Button>
      </form>
    </div>
  );
}
