"use client";

import { ExternalLink, Loader2, Package, Search, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { buttonVariants } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export function AdminProductsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR<{ products: any[] }>("/api/admin/marketplace/products", fetcher);

  const products = data?.products || [];

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.merchant?.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === "all" ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      p.merchant?.categorySlug?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in_stock" && p.isAvailable) ||
      (stockFilter === "out_of_stock" && !p.isAvailable);

    return matchesSearch && matchesCategory && matchesStock;
  });

  async function handleToggleAvailability(product: any) {
    sounds.tap();
    haptics.light();
    setTogglingId(product.id);

    try {
      const res = await fetch("/api/admin/marketplace/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          isAvailable: !product.isAvailable,
        }),
      });

      if (!res.ok) throw new Error();
      mutate();
      toast.success(
        !product.isAvailable ? `${product.name} is now In Stock` : `${product.name} marked Out of Stock`
      );
    } catch {
      toast.error("Couldn't update stock. Try again.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6 select-none">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl text-fg">
            <UtensilsCrossed className="size-5 text-fg-muted" aria-hidden />
            <span>Products</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            Every item on sale in the marketplace, with price and stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/marketplace/merchants"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            All merchants
          </Link>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
          <input
            aria-label="Search products"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item, store or tag"
            className={cn(fieldClassName, "w-full pl-10 pr-4 h-11")}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            aria-label="Stock"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className={cn(fieldClassName, "h-11")}
          >
            <option value="all">All stock</option>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* ─── Products Catalog Table ─── */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-fg">Products</h2>
          <span className="text-xs text-fg-muted font-semibold">{filteredProducts.length} items listed</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="divide-y divide-border overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-xs">
              <thead className="bg-surface-muted text-fg-muted font-bold text-xs">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Store</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Stock Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-muted transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg overflow-hidden bg-surface-muted shrink-0 border border-border">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="size-full object-cover" />
                          ) : (
                            <div className="size-full flex items-center justify-center text-fg-muted">
                              <Package className="size-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-fg">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-fg-muted line-clamp-1">{p.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-fg">
                      <Link
                        href={`/marketplace/store/${p.merchantId}`}
                        target="_blank"
                        className="hover:underline flex items-center gap-1"
                      >
                        <span>{p.merchant?.name || "Store"}</span>
                        <ExternalLink className="size-3 text-fg-muted" />
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-surface-muted font-bold text-xs text-fg-muted">
                        {p.category || "General"}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-fg text-sm">₹{p.price}</td>
                    <td className="p-3">
                      {p.isVeg === true && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success-subtle text-success font-bold text-xs">
                          <span className="size-1.5 rounded-full bg-success inline-block" /> VEG
                        </span>
                      )}
                      {p.isVeg === false && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-danger-subtle text-danger font-bold text-xs">
                          <span className="size-1.5 rounded-full bg-danger inline-block" /> NON-VEG
                        </span>
                      )}
                      {p.isVeg === null && <span className="text-xs text-fg-muted">—</span>}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        disabled={togglingId === p.id}
                        onClick={() => handleToggleAvailability(p)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer border",
                          p.isAvailable
                            ? "bg-success-subtle text-success border-success/30 hover:bg-success-subtle"
                            : "bg-danger-subtle text-danger border-danger/30 hover:bg-danger-subtle"
                        )}
                      >
                        {togglingId === p.id ? (
                          <Loader2 className="size-3 animate-spin mx-auto" />
                        ) : p.isAvailable ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-success inline-block" /> In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-danger inline-block" /> Out of Stock
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          const newPriceStr = prompt(
                            `Update price for ${p.name} (Current: ₹${p.price}):`,
                            String(p.price)
                          );
                          if (newPriceStr !== null) {
                            const newPrice = parseInt(newPriceStr, 10);
                            if (!isNaN(newPrice) && newPrice >= 0) {
                              try {
                                await fetch("/api/admin/marketplace/products", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: p.id, price: newPrice }),
                                });
                                mutate();
                                toast.success(`Price updated to ₹${newPrice}`);
                              } catch {
                                toast.error("Couldn't update the price. Try again.");
                              }
                            }
                          }
                        }}
                        className="text-xs font-bold text-brand-text hover:underline cursor-pointer"
                      >
                        Edit Price
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center space-y-2">
            <Package className="size-10 text-fg-subtle mx-auto" />
            <p className="text-sm font-bold text-fg">No products match</p>
            <p className="text-xs text-fg-muted">Try another search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
