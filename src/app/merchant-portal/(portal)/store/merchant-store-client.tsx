"use client";

import { Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { LoadError } from "@/components/merchant/load-error";
import { MerchantListSkeleton, MerchantPage } from "@/components/merchant/merchant-page";
import { copyStoreLink, readError, storePath } from "@/components/merchant/merchant-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="block text-sm font-semibold text-fg">{label}</span>
        <span className="block text-sm text-fg-muted">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
    </label>
  );
}

export function MerchantStoreClient() {
  const { data, error, isLoading, mutate } = useSWR<{ merchant: any }>("/api/merchant/store", fetcher, {
    dedupingInterval: 15000,
  });
  const merchant = data?.merchant;

  const [f, setF] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
    locationPin: "",
    deliveryFee: "20",
    minOrderValue: "80",
    freeDeliveryAbove: "",
    estimatedPrepTime: "15–25 min",
    pickupInstructions: "",
    isDeliveryEnabled: true,
    isPickupEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState<{ name?: boolean; address?: boolean }>({});
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!merchant) return;
    setF({
      name: merchant.name || "",
      description: merchant.description || "",
      phone: merchant.phone || "",
      address: merchant.address || "",
      locationPin: merchant.locationPin || "",
      deliveryFee: String(merchant.deliveryFee ?? 20),
      minOrderValue: String(merchant.minOrderValue ?? 80),
      freeDeliveryAbove: merchant.freeDeliveryAbove ? String(merchant.freeDeliveryAbove) : "",
      estimatedPrepTime: merchant.estimatedPrepTime || "15–25 min",
      pickupInstructions: merchant.pickupInstructions || "",
      isDeliveryEnabled: merchant.isDeliveryEnabled !== false,
      isPickupEnabled: merchant.isPickupEnabled !== false,
    });
  }, [merchant]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const gaps = { name: !f.name.trim(), address: !f.address.trim() };
    setMissing(gaps);
    if (gaps.name || gaps.address) {
      toast.error("Add your store name and address, then save.");
      return;
    }
    sounds.send();
    haptics.success();
    setSaving(true);
    try {
      const res = await fetch("/api/merchant/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name.trim(),
          description: f.description.trim(),
          phone: f.phone.trim(),
          address: f.address.trim(),
          locationPin: f.locationPin.trim(),
          deliveryFee: Number.parseInt(f.deliveryFee, 10) || 0,
          minOrderValue: Number.parseInt(f.minOrderValue, 10) || 0,
          freeDeliveryAbove: f.freeDeliveryAbove ? Number.parseInt(f.freeDeliveryAbove, 10) : null,
          estimatedPrepTime: f.estimatedPrepTime.trim(),
          pickupInstructions: f.pickupInstructions.trim(),
          isDeliveryEnabled: f.isDeliveryEnabled,
          isPickupEnabled: f.isPickupEnabled,
        }),
      });
      if (!res.ok) throw new Error(await readError(res, "Couldn't save. Try again."));
      await mutate();
      toast.success("Store details saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MerchantPage
      width="narrow"
      title="Store details"
      description="What students see on your store page."
      secondaryActions={
        merchant?.id ? (
          <>
            <Button asChild variant="outline">
              <Link href={storePath(merchant.id)} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                View store
              </Link>
            </Button>
            <Button variant="outline" onClick={() => void copyStoreLink(merchant.id)}>
              <Copy />
              Copy link
            </Button>
          </>
        ) : undefined
      }
    >
      {isLoading ? (
        <MerchantListSkeleton rows={2} rowClassName="h-64" />
      ) : error ? (
        <LoadError what="your store details" onRetry={mutate} />
      ) : (
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <Card>
            <CardHeader>
              <CardTitle>About your store</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Store name"
                required
                error={missing.name ? "Add your store name." : undefined}
              >
                <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
              </FormField>
              <FormField label="Short description">
                <Textarea
                  rows={2}
                  value={f.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Momos, rolls and cold coffee near Gate 2."
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Phone">
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={f.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </FormField>
                <FormField label="Landmark" hint="Like “250 m from Gate 1”.">
                  <Input value={f.locationPin} onChange={(e) => set("locationPin", e.target.value)} />
                </FormField>
              </div>
              <FormField
                label="Address"
                required
                error={missing.address ? "Add your address so students can find you." : undefined}
              >
                <Input value={f.address} onChange={(e) => set("address", e.target.value)} />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery and pickup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                label="Delivery"
                hint="You bring orders to hostels."
                checked={f.isDeliveryEnabled}
                onChange={(v) => set("isDeliveryEnabled", v)}
              />
              <ToggleRow
                label="Pickup"
                hint="Students collect from your counter."
                checked={f.isPickupEnabled}
                onChange={(v) => set("isPickupEnabled", v)}
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <FormField label="Delivery fee (₹)">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={f.deliveryFee}
                    onChange={(e) => set("deliveryFee", e.target.value)}
                  />
                </FormField>
                <FormField label="Min order (₹)">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={f.minOrderValue}
                    onChange={(e) => set("minOrderValue", e.target.value)}
                  />
                </FormField>
                <FormField label="Free delivery over (₹)" className="col-span-2 sm:col-span-1">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={f.freeDeliveryAbove}
                    onChange={(e) => set("freeDeliveryAbove", e.target.value)}
                    placeholder="Leave empty for never"
                  />
                </FormField>
              </div>
              <FormField label="Usual wait time">
                <Input
                  value={f.estimatedPrepTime}
                  onChange={(e) => set("estimatedPrepTime", e.target.value)}
                  placeholder="15–20 min"
                />
              </FormField>
              <FormField label="Pickup instructions">
                <Input
                  value={f.pickupInstructions}
                  onChange={(e) => set("pickupInstructions", e.target.value)}
                  placeholder="Show your order number at the counter."
                />
              </FormField>
            </CardContent>
          </Card>

          <div className="sticky bottom-4 z-(--z-raised)">
            <Button type="submit" size="lg" className="w-full" loading={saving}>
              Save details
            </Button>
          </div>
        </form>
      )}
    </MerchantPage>
  );
}
