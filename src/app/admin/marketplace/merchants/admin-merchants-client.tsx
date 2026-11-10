"use client";

import { ExternalLink, Plus, Search, Star, Store } from "lucide-react";
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

export function AdminMerchantsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data, isLoading, mutate } = useSWR<{ merchants: any[] }>(
    "/api/admin/marketplace/merchants",
    fetcher
  );

  const merchants = data?.merchants || [];

  const filteredMerchants = merchants.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.address?.toLowerCase().includes(q) ||
      m.institution?.name?.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === "all" || m.categorySlug?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 select-none">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl text-fg">
            <Store className="size-5 text-fg-muted" aria-hidden />
            <span>Merchants</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            Every store selling on the campus marketplace.
          </p>
        </div>

        <Link
          href="/admin/marketplace/merchants/new"
          onClick={() => {
            sounds.tap();
            haptics.light();
          }}
          className={cn(buttonVariants({ variant: "primary", size: "sm" }), "w-fit")}
        >
          <Plus className="size-3.5 stroke-3" />
          <span>Add a merchant</span>
        </Link>
      </div>

      {/* ─── Search & Category Filter Bar ─── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
          <input
            aria-label="Search stores"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by store, college or location"
            className={cn(fieldClassName, "w-full pl-10 pr-4 h-11")}
          />
        </div>

        <select
          aria-label="Category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={cn(fieldClassName, "w-full sm:w-auto h-11")}
        >
          <option value="all">All types</option>
          <option value="food">Food</option>
          <option value="rentals">Bike rentals</option>
          <option value="barber">Salon</option>
          <option value="laundry">Laundry</option>
          <option value="water">20L Water Delivery</option>
          <option value="essentials">Grocery</option>
        </select>
      </div>

      {/* ─── Merchants Table ─── */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-fg">Merchants</h2>
          <span className="text-xs text-fg-muted font-semibold">
            {filteredMerchants.length} stores active
          </span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : filteredMerchants.length > 0 ? (
          <div className="divide-y divide-border overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="bg-surface-muted text-fg-muted font-bold text-xs">
                <tr>
                  <th className="p-3">Store Name</th>
                  <th className="p-3">Campus Hub</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Credentials</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMerchants.map((m) => {
                  const pass = m.loginPassword || `store@${m.slug}`;
                  const user = m.loginUsername || m.slug;
                  return (
                    <tr key={m.id} className="hover:bg-surface-muted transition-colors">
                      <td className="p-3 font-bold text-fg">
                        <Link
                          href={`/admin/marketplace/merchants/${m.id}`}
                          className="flex items-center gap-2.5 group hover:underline"
                        >
                          <div className="size-9 rounded-lg overflow-hidden bg-surface-muted shrink-0 border border-border">
                            <img src={m.logoUrl} alt={m.name} className="size-full object-cover" />
                          </div>
                          <div>
                            <p className="group-hover:text-brand-text transition-colors">{m.name}</p>
                            <p className="text-xs text-fg-muted font-normal">{m.address}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-3 text-fg-muted font-medium">
                        {m.institution?.name?.split(",")[0] || "BIT Mesra"}
                      </td>
                      <td className="p-3 font-bold text-xs text-brand-text">{m.categorySlug}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.tap();
                            haptics.light();
                            const creds = `Store: ${m.name}\nUsername: ${user}\nPassword: ${pass}\nPortal: https://campusloop.space/merchant-portal/login`;
                            navigator.clipboard.writeText(creds);
                            toast.success(`Login details for ${m.name} copied`);
                          }}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                          title="Copy login details"
                        >
                          <span>@{user}</span>
                          <span className="text-fg-muted font-normal">({pass})</span>
                        </button>
                      </td>
                      <td className="p-3 text-fg-muted">{m.phone || "—"}</td>
                      <td className="p-3 font-bold text-warning">
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="size-3 fill-warning text-warning" />
                          {m.rating}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-success-subtle text-success font-bold text-xs">
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Link
                          href={`/admin/marketplace/merchants/${m.id}`}
                          className="text-xs font-bold text-fg-muted hover:text-fg hover:underline"
                        >
                          Manage
                        </Link>
                        <Link
                          href={`/marketplace/store/${m.id}`}
                          target="_blank"
                          className="text-xs font-bold text-brand-text hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>View</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center space-y-2">
            <Store className="size-10 text-fg-subtle mx-auto" />
            <p className="text-sm font-bold text-fg">No merchants match</p>
            <p className="text-xs text-fg-muted">Try another search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
