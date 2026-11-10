"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MerchantPage } from "@/components/merchant/merchant-page";
import { readError } from "@/components/merchant/merchant-utils";
import { ProductForm, type ProductFormValues } from "@/components/merchant/products/product-form";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function NewProductClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(v: ProductFormValues) {
    sounds.send();
    haptics.success();
    setSaving(true);
    try {
      const res = await fetch("/api/merchant/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          categoryName: v.categoryName,
          price: v.price,
          originalPrice: v.originalPrice ?? undefined,
          preparationTime: v.preparationTime,
          description: v.description || undefined,
          imageUrl: v.imageUrl,
          isVeg: v.isVeg,
          addons: v.addons,
        }),
      });
      if (!res.ok) throw new Error(await readError(res, "Couldn't add the item. Try again."));
      toast.success(`${v.name} is on your menu`);
      router.push("/merchant-portal/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add the item. Try again.");
      setSaving(false);
    }
  }

  return (
    <MerchantPage
      width="narrow"
      title="Add an item"
      backHref="/merchant-portal/products"
      backLabel="Back to menu"
    >
      <ProductForm submitLabel="Add to menu" saving={saving} onSubmit={handleSubmit} />
    </MerchantPage>
  );
}
