"use client";

import { PackageX, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { LoadError } from "@/components/merchant/load-error";
import { MerchantListSkeleton, MerchantPage } from "@/components/merchant/merchant-page";
import { readError } from "@/components/merchant/merchant-utils";
import { ProductForm, type ProductFormValues } from "@/components/merchant/products/product-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface EditProductClientProps {
  productId: string;
}

export function EditProductClient({ productId }: EditProductClientProps) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<{ product: any }>(
    `/api/merchant/products/${productId}`,
    fetcher,
    {
      dedupingInterval: 5000,
    }
  );
  const product = data?.product;
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(v: ProductFormValues) {
    setSaving(true);
    sounds.send();
    haptics.medium();
    try {
      const res = await fetch(`/api/merchant/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v,
          description: v.description || null,
          isNonVeg: !v.isVeg,
        }),
      });
      if (!res.ok) throw new Error(await readError(res, "Couldn't save your changes. Try again."));
      sounds.ting();
      haptics.success();
      toast.success("Changes saved");
      mutate();
      router.push("/merchant-portal/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    haptics.heavy();
    try {
      const res = await fetch(`/api/merchant/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res, "Couldn't delete the item. Try again."));
      toast.success("Item deleted");
      router.push("/merchant-portal/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the item. Try again.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <MerchantPage
      width="narrow"
      title={product?.name || "Edit item"}
      backHref="/merchant-portal/products"
      backLabel="Back to menu"
      secondaryActions={
        product ? (
          <Button variant="ghost" className="text-danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 />
            Delete
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <MerchantListSkeleton rows={3} rowClassName="h-40" />
      ) : error && !/not found/i.test(String(error?.message)) ? (
        <LoadError what="this item" onRetry={mutate} />
      ) : !product ? (
        <EmptyState
          bordered
          icon={PackageX}
          title="This item doesn't exist"
          description="It may have been deleted."
          action={
            <Button asChild variant="outline">
              <Link href="/merchant-portal/products">Back to menu</Link>
            </Button>
          }
        />
      ) : (
        <ProductForm
          key={product.id}
          showAvailability
          submitLabel="Save changes"
          saving={saving}
          onSubmit={handleSave}
          initial={{
            name: product.name || "",
            categoryName: product.categoryName || "Popular",
            price: product.price,
            originalPrice: product.originalPrice || null,
            preparationTime: product.preparationTime || "15 min",
            description: product.description || "",
            imageUrl: product.imageUrl || null,
            isVeg: product.isVeg !== false,
            isAvailable: product.isAvailable !== false,
            addons: Array.isArray(product.addons) ? product.addons : [],
          }}
        />
      )}
      <ConfirmDialog
        isOpen={confirmDelete}
        title={`Delete ${product?.name || "this item"}?`}
        description="Students won't see it anymore. You can't undo this."
        confirmText="Delete"
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </MerchantPage>
  );
}
