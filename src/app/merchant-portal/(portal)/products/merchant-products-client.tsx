"use client";

import { Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { LoadError } from "@/components/merchant/load-error";
import { SearchField } from "@/components/merchant/merchant-filters";
import { MerchantListSkeleton, MerchantPage } from "@/components/merchant/merchant-page";
import { readError, rupees } from "@/components/merchant/merchant-utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function MerchantProductsClient() {
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ products: any[] }>("/api/merchant/products", fetcher, {
    dedupingInterval: 10000,
  });
  const products = data?.products || [];
  const q = query.toLowerCase().trim();
  const filtered = q
    ? products.filter((p) => p.name?.toLowerCase().includes(q) || p.categoryName?.toLowerCase().includes(q))
    : products;

  async function toggleStock(id: string, available: boolean) {
    sounds.tap();
    haptics.light();
    setUpdatingId(id);
    try {
      const res = await fetch("/api/merchant/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isAvailable: !available }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success(!available ? "Back in stock" : "Marked out of stock");
    } catch {
      toast.error("Couldn't change stock. Try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/merchant/products?id=${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res, "Couldn't delete the item. Try again."));
      await mutate();
      toast.success("Item deleted");
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the item. Try again.");
    } finally {
      setDeleteBusy(false);
    }
  }

  const addButton = (
    <Button asChild>
      <Link href="/merchant-portal/products/new">
        <Plus />
        Add item
      </Link>
    </Button>
  );

  return (
    <MerchantPage
      title="Menu"
      description="Everything students can order from you."
      primaryAction={addButton}
      toolbar={
        products.length > 0 ? (
          <SearchField
            label="Search menu"
            value={query}
            onChange={setQuery}
            placeholder="Search by name or section"
          />
        ) : undefined
      }
    >
      {isLoading ? (
        <MerchantListSkeleton rows={4} rowClassName="h-20" />
      ) : error ? (
        <LoadError what="your menu" onRetry={mutate} />
      ) : filtered.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {filtered.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted text-fg-subtle">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <UtensilsCrossed className="size-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{p.name}</p>
                <p className="truncate text-sm text-fg-muted">
                  <span className="tabular-nums">{rupees(p.price)}</span>
                  {p.categoryName ? ` · ${p.categoryName}` : ""}
                </p>
              </div>
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-fg-muted">
                <span className="hidden sm:inline">{p.isAvailable ? "In stock" : "Sold out"}</span>
                <Switch
                  aria-label={`${p.name} in stock`}
                  checked={Boolean(p.isAvailable)}
                  disabled={updatingId === p.id}
                  onCheckedChange={() => void toggleStock(p.id, Boolean(p.isAvailable))}
                />
              </label>
              <Button asChild variant="ghost" size="icon" aria-label={`Edit ${p.name}`}>
                <Link href={`/merchant-portal/products/${p.id}/edit`}>
                  <Pencil />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${p.name}`}
                className="hidden text-fg-muted hover:text-danger sm:inline-flex"
                onClick={() => setDeleting({ id: p.id, name: p.name })}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : q ? (
        <EmptyState
          bordered
          icon={UtensilsCrossed}
          title="Nothing matches that"
          description="Try another word."
        />
      ) : (
        <EmptyState
          bordered
          icon={UtensilsCrossed}
          title="Your menu is empty"
          description="Add your first item so students can order."
          action={addButton}
        />
      )}
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? "this item"}?`}
        description="Students won't see it anymore. You can't undo this."
        confirmText="Delete"
        isLoading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </MerchantPage>
  );
}
