"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/merchant/merchant-filters";
import { MerchantPage } from "@/components/merchant/merchant-page";
import { readError } from "@/components/merchant/merchant-utils";
import { PhotoPicker } from "@/components/merchant/photo-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

// Used only when the merchant skips the photo, so the store page never shows a broken image.
const FALLBACK_BIKE_PHOTO = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=400&fit=crop";

export function MerchantNewBikeClient() {
  const router = useRouter();
  const [f, setF] = useState({
    name: "",
    model: "",
    registrationNumber: "",
    dailyPrice: "",
    hourlyPrice: "",
    securityDeposit: "",
    pickupLocation: "",
    fuelType: "PETROL" as "PETROL" | "ELECTRIC",
    mileage: "",
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<"name" | "registrationNumber" | "dailyPrice", string>>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const daily = Number.parseInt(f.dailyPrice, 10);
    const next = {
      name: f.name.trim() ? undefined : "Give the bike a name.",
      registrationNumber: f.registrationNumber.trim() ? undefined : "Add the number plate.",
      dailyPrice: Number.isNaN(daily) || daily <= 0 ? "Enter the price per day, like 350." : undefined,
    };
    setErrors(next);
    const firstError = next.name || next.registrationNumber || next.dailyPrice;
    if (firstError) {
      toast.error(firstError);
      return;
    }

    sounds.send();
    haptics.success();
    setSaving(true);
    try {
      const res = await fetch("/api/merchant/bikes/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name.trim(),
          model: f.model.trim() || f.name.trim(),
          registrationNumber: f.registrationNumber.trim().toUpperCase(),
          dailyPrice: daily,
          hourlyPrice: Number.parseInt(f.hourlyPrice, 10) || 50,
          securityDeposit: Number.parseInt(f.securityDeposit, 10) || 1500,
          pickupLocation: f.pickupLocation.trim() || "Campus Gate 1 Stand",
          fuelType: f.fuelType,
          imageUrl: photo || FALLBACK_BIKE_PHOTO,
          specs: { mileage: f.mileage.trim() || undefined, helmetIncluded: true },
          status: "AVAILABLE",
        }),
      });
      if (!res.ok) throw new Error(await readError(res, "Couldn't add the bike. Try again."));
      toast.success(`${f.name.trim()} added`);
      router.push("/merchant-portal/bikes/fleet");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add the bike. Try again.");
      setSaving(false);
    }
  }

  return (
    <MerchantPage
      width="narrow"
      title="Add a bike"
      backHref="/merchant-portal/bikes/fleet"
      backLabel="Back to your bikes"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoPicker photos={photo ? [photo] : []} onChange={(p) => setPhoto(p[0] ?? null)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bike</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Name" required error={errors.name}>
              <Input
                value={f.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Activa 6G #3"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Model">
                <Input
                  value={f.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="Activa 6G"
                />
              </FormField>
              <FormField label="Number plate" required error={errors.registrationNumber}>
                <Input
                  value={f.registrationNumber}
                  onChange={(e) => set("registrationNumber", e.target.value)}
                  placeholder="JH01AX4822"
                  autoCapitalize="characters"
                  className="uppercase"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Fuel">
                <NativeSelect
                  value={f.fuelType}
                  onChange={(e) => set("fuelType", e.target.value as "PETROL" | "ELECTRIC")}
                >
                  <option value="PETROL">Petrol</option>
                  <option value="ELECTRIC">Electric</option>
                </NativeSelect>
              </FormField>
              <FormField label="Mileage or range">
                <Input
                  value={f.mileage}
                  onChange={(e) => set("mileage", e.target.value)}
                  placeholder="45 km/l"
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price and pickup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <FormField label="Per day (₹)" required error={errors.dailyPrice}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={f.dailyPrice}
                  onChange={(e) => set("dailyPrice", e.target.value)}
                  placeholder="350"
                />
              </FormField>
              <FormField label="Per hour (₹)" hint="Empty means ₹50.">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={f.hourlyPrice}
                  onChange={(e) => set("hourlyPrice", e.target.value)}
                  placeholder="50"
                />
              </FormField>
              <FormField label="Deposit (₹)" hint="Empty means ₹1,500." className="col-span-2 sm:col-span-1">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={f.securityDeposit}
                  onChange={(e) => set("securityDeposit", e.target.value)}
                  placeholder="1500"
                />
              </FormField>
            </div>
            <FormField label="Pickup spot" hint="Empty means Campus Gate 1 Stand.">
              <Input
                value={f.pickupLocation}
                onChange={(e) => set("pickupLocation", e.target.value)}
                placeholder="Gate 1 parking"
              />
            </FormField>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-(--z-raised)">
          <Button type="submit" size="lg" className="w-full" loading={saving}>
            Add bike
          </Button>
        </div>
      </form>
    </MerchantPage>
  );
}
