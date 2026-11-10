"use client";

import { CreditCard, ImagePlus, Wallet, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ChoiceCard } from "@/components/marketplace/choice-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";

export interface BookingDetails {
  drivingLicenseNumber: string;
  drivingLicenseUrl: string | null;
  aadhaarLast4?: string;
  customerPhone: string;
  hostelAddress: string;
  paymentMethod: "COD" | "UPI";
}

interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  submitting: boolean;
  onSubmit: (details: BookingDetails) => void;
}

/** The ID and contact form shown before a rental request is sent. */
export function BookingSheet({ open, onOpenChange, total, submitting, onSubmit }: BookingSheetProps) {
  const [licence, setLicence] = useState("");
  const [licenceUrl, setLicenceUrl] = useState<string | null>(null);
  const [aadhaar, setAadhaar] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<"COD" | "UPI">("COD");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    sounds.pop();
    haptics.light();
    try {
      const res = await uploadImageToImgBB(file);
      setLicenceUrl(res.displayUrl || res.url);
      toast.success("Licence photo added.");
    } catch {
      toast.error("Couldn't upload the photo. Try a smaller image.");
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!licence.trim()) return toast.error("Add your driving licence number.");
    if (!phone.trim()) return toast.error("Add your phone number so the shop can call you.");
    if (!address.trim()) return toast.error("Add your hostel and room.");
    onSubmit({
      drivingLicenseNumber: licence.trim(),
      drivingLicenseUrl: licenceUrl,
      aadhaarLast4: aadhaar.trim() || undefined,
      customerPhone: phone.trim(),
      hostelAddress: address.trim(),
      paymentMethod: payment,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <SheetHeader>
            <SheetTitle>Your details</SheetTitle>
            <SheetDescription>The rental shop needs these to hand over the bike.</SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rent-licence" required>
                Driving licence number
              </Label>
              <Input
                id="rent-licence"
                value={licence}
                onChange={(e) => setLicence(e.target.value.toUpperCase())}
                placeholder="DL-1420110012345"
                autoCapitalize="characters"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm font-semibold text-fg">Licence photo (optional)</span>
              {licenceUrl ? (
                <div className="flex items-center gap-3">
                  <div className="size-20 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
                    <img src={licenceUrl} alt="Your licence" className="size-full object-cover" />
                  </div>
                  <Button type="button" variant="ghost" onClick={() => setLicenceUrl(null)}>
                    <X className="size-4" aria-hidden="true" />
                    Remove photo
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  loading={uploading}
                >
                  {!uploading && <ImagePlus className="size-4" />}
                  Add a photo
                </Button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rent-aadhaar">Aadhaar last 4 (optional)</Label>
                <Input
                  id="rent-aadhaar"
                  inputMode="numeric"
                  maxLength={4}
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                  placeholder="4829"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rent-phone" required>
                  Phone
                </Label>
                <Input
                  id="rent-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rent-address" required>
                Hostel and room
              </Label>
              <Input
                id="rent-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Hostel 11, room 204"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-fg">How will you pay?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <ChoiceCard
                  selected={payment === "COD"}
                  onSelect={() => setPayment("COD")}
                  icon={Wallet}
                  title="Cash at pickup"
                />
                <ChoiceCard
                  selected={payment === "UPI"}
                  onSelect={() => setPayment("UPI")}
                  icon={CreditCard}
                  title="UPI at pickup"
                />
              </div>
            </fieldset>
          </SheetBody>
          <SheetFooter>
            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              {submitting ? "Sending request..." : `Request booking · ₹${total.toLocaleString("en-IN")}`}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
