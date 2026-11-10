"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PhotoPicker } from "../photo-picker";
import { AddonEditor, type ProductAddon } from "./addon-editor";

export type ProductFormValues = {
  name: string;
  categoryName: string;
  price: number;
  originalPrice: number | null;
  preparationTime: string;
  description: string;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  addons: ProductAddon[];
};

const SECTIONS = [
  "Popular",
  "Maggi & noodles",
  "Rolls",
  "Burgers",
  "Combos",
  "Drinks",
  "Snacks",
  "Today's special",
];

interface ProductFormProps {
  initial?: Partial<ProductFormValues>;
  submitLabel: string;
  saving: boolean;
  /** Shows the "In stock" switch (only editing can change it). */
  showAvailability?: boolean;
  onSubmit: (values: ProductFormValues) => void;
}

/** Add or edit a menu item. Shared by the new and edit screens. */
export function ProductForm({ initial, submitLabel, saving, showAvailability, onSubmit }: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryName, setCategoryName] = useState(initial?.categoryName ?? "Popular");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [originalPrice, setOriginalPrice] = useState(
    initial?.originalPrice ? String(initial.originalPrice) : ""
  );
  const [prepTime, setPrepTime] = useState(initial?.preparationTime ?? "15 min");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [isVeg, setIsVeg] = useState(initial?.isVeg ?? true);
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? true);
  const [addons, setAddons] = useState<ProductAddon[]>(initial?.addons ?? []);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericPrice = Number.parseInt(price, 10);
    const next = {
      name: name.trim() ? undefined : "Give the item a name.",
      price:
        Number.isNaN(numericPrice) || numericPrice < 0 ? "Enter the price in rupees, like 90." : undefined,
    };
    setErrors(next);
    if (next.name || next.price) {
      toast.error(next.name || next.price);
      return;
    }
    onSubmit({
      name: name.trim(),
      categoryName: categoryName.trim() || "Popular",
      price: numericPrice,
      originalPrice: originalPrice ? Number.parseInt(originalPrice, 10) : null,
      preparationTime: prepTime.trim() || "15 min",
      description: description.trim(),
      imageUrl: imageUrl.trim() || null,
      isVeg,
      isAvailable,
      addons,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PhotoPicker photos={imageUrl ? [imageUrl] : []} onChange={(p) => setImageUrl(p[0] ?? "")} />
          <FormField label="Or paste a photo link">
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://"
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Name" required error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cheese masala Maggi" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Price (₹)" required error={errors.price}>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="90"
              />
            </FormField>
            <FormField label="Old price (₹)" hint="Shown struck out.">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="110"
              />
            </FormField>
          </div>
          <FormField label="Menu section">
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Rolls"
            />
          </FormField>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <Chip key={s} selected={categoryName === s} onClick={() => setCategoryName(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <FormField label="Ready in">
            <Input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="15 min" />
          </FormField>
          <FormField label="Description">
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's in it, in one line."
            />
          </FormField>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-fg">Food type</p>
            <SegmentedControl
              aria-label="Food type"
              value={isVeg ? "veg" : "nonveg"}
              onChange={(v) => setIsVeg(v === "veg")}
              options={[
                { value: "veg", label: "Veg" },
                { value: "nonveg", label: "Non-veg" },
              ]}
            />
          </div>
          {showAvailability && (
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-fg">In stock</span>
                <span className="block text-sm text-fg-muted">Turn off when it runs out.</span>
              </span>
              <Switch checked={isAvailable} onCheckedChange={(v) => setIsAvailable(Boolean(v))} />
            </label>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extras</CardTitle>
        </CardHeader>
        <CardContent>
          <AddonEditor addons={addons} onChange={setAddons} />
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-(--z-raised)">
        <Button type="submit" size="lg" className="w-full" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
