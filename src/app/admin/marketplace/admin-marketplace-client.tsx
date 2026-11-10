"use client";

import {
  Bike,
  ChevronDown,
  Droplet,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Leaf,
  Package,
  Plus,
  RefreshCw,
  Scissors,
  Search,
  Share2,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useEscapeKey } from "@/app/admin/_components/use-escape-key";
import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fieldClassName } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { AdminStatStrip } from "../_components/admin-stat-strip";

const CATEGORIES = [
  { id: "all", label: "All Verticals", icon: Store, color: "text-brand-text", bg: "bg-brand-subtle" },
  {
    id: "food",
    label: "Food & Canteens",
    icon: UtensilsCrossed,
    color: "text-danger",
    bg: "bg-danger-subtle",
  },
  {
    id: "supermarket",
    label: "Supermarket & Mart",
    icon: ShoppingBag,
    color: "text-warning",
    bg: "bg-warning-subtle",
  },
  {
    id: "rentals",
    label: "Bike & Vehicle Rentals",
    icon: Bike,
    color: "text-success",
    bg: "bg-success-subtle",
  },
  { id: "barber", label: "Barber & Salon", icon: Scissors, color: "text-brand-text", bg: "bg-brand-subtle" },
  { id: "laundry", label: "Laundry & Wash", icon: Shirt, color: "text-brand-text", bg: "bg-brand-subtle" },
  {
    id: "water",
    label: "20L Water Can Delivery",
    icon: Droplet,
    color: "text-brand-text",
    bg: "bg-brand-subtle",
  },
] as const;

export function AdminMarketplaceClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);

  // Quick credentials modal state
  const [credentialModalStore, setCredentialModalStore] = useState<any | null>(null);
  useEscapeKey(Boolean(credentialModalStore), () => setCredentialModalStore(null));
  const [showPassword, setShowPassword] = useState(false);
  // Held in memory only, for the one render after a rotate. Never persisted.
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  // Quick product modal state
  const [productModalStore, setProductModalStore] = useState<any | null>(null);
  useEscapeKey(Boolean(productModalStore), () => setProductModalStore(null));
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOriginalPrice, setProdOriginalPrice] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodIsVeg, setProdIsVeg] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const { data, isLoading, mutate } = useSWR<{
    merchants: any[];
    stats?: {
      totalMerchants: number;
      activeMerchants: number;
      totalProducts: number;
      totalOrders: number;
      totalGmv: number;
    };
  }>("/api/admin/marketplace/merchants", fetcher, { dedupingInterval: 6000 });

  const merchants = data?.merchants || [];
  const stats = data?.stats;
  const activeStoresCount = stats?.activeMerchants ?? merchants.filter((m) => m.isOpen).length;
  const totalProducts =
    stats?.totalProducts ?? merchants.reduce((sum, m) => sum + (m.products?.length || 0), 0);
  const totalOrders = stats?.totalOrders ?? merchants.reduce((sum, m) => sum + (m.orders?.length || 0), 0);
  const totalGmv = stats?.totalGmv ?? 0;

  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      const cat = m.categorySlug === "essentials" ? "supermarket" : m.categorySlug || "food";
      if (selectedCategory !== "all" && cat !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name?.toLowerCase().includes(q) ||
          m.address?.toLowerCase().includes(q) ||
          m.categorySlug?.toLowerCase().includes(q) ||
          m.loginUsername?.toLowerCase().includes(q) ||
          m.institution?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [merchants, selectedCategory, searchQuery]);

  // Group stores by category for Tier 1 hierarchy
  const categorizedMerchants = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const m of filteredMerchants) {
      const cat = m.categorySlug === "essentials" ? "supermarket" : m.categorySlug || "food";
      if (!map[cat]) map[cat] = [];
      map[cat].push(m);
    }
    return map;
  }, [filteredMerchants]);

  // Rotate credentials directly
  async function handleRotateCredentials(merchantId: string) {
    sounds.tap();
    haptics.medium();
    setIsRotating(true);

    try {
      // The server generates and hashes it, then echoes the plaintext exactly
      // once in the response.
      const res = await fetch(`/api/admin/marketplace/merchants/${merchantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotatePassword: true }),
      });

      if (!res.ok) throw new Error();
      const data = (await res.json()) as { temporaryPassword?: string | null };
      if (!data.temporaryPassword) throw new Error();

      sounds.ting();
      haptics.success();
      toast.success("New password made. Copy it now, it won't be shown again.");
      mutate();
      setRevealedPassword(data.temporaryPassword);
      setShowPassword(true);
    } catch {
      toast.error("Couldn't change the password. Try again.");
    } finally {
      setIsRotating(false);
    }
  }

  // Copy WhatsApp Invitation text.
  function handleCopyWhatsApp(merchant: any) {
    sounds.tap();
    haptics.medium();

    const activePass =
      revealedPassword ||
      (merchant.loginPassword && !merchant.loginPassword.startsWith("pbkdf2$")
        ? merchant.loginPassword
        : "canteen@password123");

    const text = `*CampusLoop Merchant Portal Credentials*\n\nStore: ${merchant.name}\nCampus: ${merchant.institution?.name || "Campus Hub"}\n\nLogin URL: https://campusloop.space/merchant-portal/login\nUsername: ${merchant.loginUsername || merchant.slug}\nPassword: ${activePass}\n\nPlease login and manage your store menu, pricing, and live customer orders!`;
    navigator.clipboard.writeText(text);
    toast.success("WhatsApp message copied");
  }

  // Save product in store modal
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!productModalStore || !prodName.trim() || !prodPrice.trim()) return;

    setIsSavingProduct(true);
    sounds.tap();
    haptics.light();

    try {
      if (editingProduct) {
        // Edit product
        const res = await fetch("/api/admin/marketplace/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            name: prodName.trim(),
            price: parseInt(prodPrice, 10) || 0,
            originalPrice: prodOriginalPrice ? parseInt(prodOriginalPrice, 10) : null,
            categoryName: prodCategory.trim() || "General",
            isVeg: prodIsVeg,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success("Product saved");
      } else {
        // Add new product
        const res = await fetch("/api/admin/marketplace/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantId: productModalStore.id,
            name: prodName.trim(),
            price: parseInt(prodPrice, 10) || 0,
            originalPrice: prodOriginalPrice ? parseInt(prodOriginalPrice, 10) : null,
            categoryName: prodCategory.trim() || "General",
            isVeg: prodIsVeg,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success("Product added");
      }

      setProductModalStore(null);
      setEditingProduct(null);
      mutate();
    } catch {
      toast.error("Couldn't save the product. Try again.");
    } finally {
      setIsSavingProduct(false);
    }
  }

  // 1-Click Store Open / Close status toggle
  async function handleToggleStoreStatus(store: any) {
    sounds.tap();
    haptics.medium();
    const nextIsOpen = !store.isOpen;
    try {
      const res = await fetch(`/api/admin/marketplace/merchants/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: nextIsOpen }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${store.name} is now ${nextIsOpen ? "OPEN" : "CLOSED"}`);
      mutate();
    } catch {
      toast.error("Couldn't update the store. Try again.");
    }
  }

  // 1-Click Product In-Stock / Out-of-Stock toggle
  async function handleToggleProductAvailability(prodId: string, currentAvailable: boolean) {
    sounds.tap();
    haptics.light();
    try {
      const res = await fetch("/api/admin/marketplace/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prodId, isAvailable: !currentAvailable }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Marked ${!currentAvailable ? "in stock" : "out of stock"}`);
      mutate();
    } catch {
      toast.error("Couldn't update stock. Try again.");
    }
  }

  // Delete product
  async function handleDeleteProduct(prodId: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    sounds.tap();
    try {
      const res = await fetch(`/api/admin/marketplace/products?id=${prodId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Product removed");
      mutate();
    } catch {
      toast.error("Couldn't delete the product. Try again.");
    }
  }

  return (
    <div className="space-y-6 select-none pb-20">
      {/* Actions */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/marketplace/merchants/new"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            <Plus className="size-3.5 stroke-3" />
            <span>Add a merchant</span>
          </Link>
        </div>
      </div>

      <AdminStatStrip
        items={[
          { label: "Stores", value: merchants.length, note: `${activeStoresCount} open` },
          { label: "Products", value: totalProducts },
          { label: "Orders", value: totalOrders },
          { label: "Order value", value: `₹${totalGmv.toLocaleString("en-IN")}` },
        ]}
      />

      {/* ─── Search & Category Pill Filters ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
          <input
            aria-label="Search stores"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stores, owners or colleges"
            className={cn(fieldClassName, "w-full pl-10 pr-4 h-11")}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = selectedCategory === c.id;
            return (
              <Chip
                size="sm"
                selected={isActive}
                key={c.id}
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setSelectedCategory(c.id);
                }}
              >
                <Icon className="size-3.5" />
                <span>{c.label}</span>
              </Chip>
            );
          })}
        </div>
      </div>

      {/* ─── 3-Tier Hierarchy Listing: Category ➔ Stores ➔ Products ─── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : Object.keys(categorizedMerchants).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(categorizedMerchants).map(([catSlug, storeList]) => {
            const categoryMeta = CATEGORIES.find((c) => c.id === catSlug) || {
              label: catSlug.toUpperCase(),
              icon: Store,
              color: "text-brand-text",
              bg: "bg-brand-subtle",
            };
            const CatIcon = categoryMeta.icon;

            return (
              <div key={catSlug} className="rounded-lg border border-border bg-surface overflow-hidden">
                {/* ── Tier 1: Category Header ── */}
                <div className="p-4 border-b border-border bg-surface-muted flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center font-bold",
                        categoryMeta.bg,
                        categoryMeta.color
                      )}
                    >
                      <CatIcon className="size-4.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-fg capitalize flex items-center gap-2">
                        <span>{categoryMeta.label}</span>
                        <span className="text-xs font-bold text-fg-muted">({storeList.length} stores)</span>
                      </h2>
                    </div>
                  </div>

                  <Link
                    href={`/marketplace/${catSlug === "essentials" ? "supermarket" : catSlug}`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs font-bold text-brand-text hover:underline"
                  >
                    <span>View store</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>

                {/* ── Tier 2: Stores Under Category ── */}
                <div className="divide-y divide-border">
                  {storeList.map((store) => {
                    const isExpanded = expandedStoreId === store.id;
                    const storeProducts = store.products || [];

                    return (
                      <div key={store.id} className="p-4 space-y-3 hover:bg-surface-muted transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Store Info */}
                          <div className="flex items-center gap-3">
                            <div className="size-12 rounded-lg bg-surface-muted border border-border overflow-hidden shrink-0">
                              <img
                                src={store.logoUrl || store.coverUrl}
                                alt={store.name}
                                className="size-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-fg">{store.name}</h3>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStoreStatus(store)}
                                  className={cn(
                                    "px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
                                    store.isOpen
                                      ? "bg-success-subtle text-success border border-success/30 hover:bg-success-subtle"
                                      : "bg-danger-subtle text-danger border border-danger/30 hover:bg-danger-subtle"
                                  )}
                                  title={`Click to ${store.isOpen ? "Close" : "Open"} store`}
                                >
                                  {store.isOpen ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="size-1.5 rounded-full bg-success" />
                                      OPEN
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="size-1.5 rounded-full bg-danger" />
                                      CLOSED
                                    </span>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-fg-muted">
                                {store.institution?.name?.split(",")[0] || "BIT Mesra"} · {store.address}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono font-bold text-fg bg-surface-muted px-2 py-0.5 rounded-md">
                                  User: @{store.loginUsername || store.slug}
                                </span>
                                <span className="text-xs font-bold text-success inline-flex items-center gap-0.5">
                                  <Star className="size-3 fill-warning text-warning" />
                                  {store.rating || "4.7"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Admin Actions for this Store */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.tap();
                                haptics.light();
                                const activePass =
                                  store.loginPassword && !store.loginPassword.startsWith("pbkdf2$")
                                    ? store.loginPassword
                                    : "canteen@password123";
                                setCredentialModalStore(store);
                                setRevealedPassword(activePass);
                                setShowPassword(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-success/30 bg-success-subtle text-success text-xs font-bold hover:bg-success-subtle transition-colors cursor-pointer"
                            >
                              <KeyRound className="size-3.5" />
                              <span>Login details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyWhatsApp(store)}
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                              title="Copy WhatsApp invite message"
                            >
                              <Share2 className="size-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            <Link
                              href={`/admin/marketplace/merchants/${store.id}`}
                              className={buttonVariants({ variant: "primary", size: "sm" })}
                            >
                              <Edit2 className="size-3" />
                              <span>Manage</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                sounds.tap();
                                haptics.light();
                                setExpandedStoreId(isExpanded ? null : store.id);
                              }}
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              <Package className="size-3.5" />
                              <span>Products ({storeProducts.length})</span>
                              <ChevronDown
                                className={cn("size-3.5 transition-transform", isExpanded && "rotate-180")}
                              />
                            </button>
                          </div>
                        </div>

                        {/* ── Tier 3: Products Under this Store ── */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-border space-y-3 bg-surface-muted -mx-4 -mb-4 p-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-fg-muted">Products</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.tap();
                                  setProductModalStore(store);
                                  setEditingProduct(null);
                                  setProdName("");
                                  setProdPrice("");
                                  setProdOriginalPrice("");
                                  setProdCategory("General");
                                  setProdIsVeg(true);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand text-brand-fg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                              >
                                <Plus className="size-3" />
                                <span>Add Product</span>
                              </button>
                            </div>

                            {storeProducts.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {storeProducts.map((p: any) => (
                                  <div
                                    key={p.id}
                                    className="p-3 rounded-lg border border-border bg-surface flex items-center justify-between gap-2 "
                                  >
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-fg truncate">{p.name}</p>
                                      <p className="text-xs text-fg-muted">
                                        <span className="font-bold text-fg">₹{p.price}</span>
                                        {p.originalPrice && (
                                          <span className="line-through ml-1 text-xs">
                                            ₹{p.originalPrice}
                                          </span>
                                        )}{" "}
                                        · {p.categoryName || "General"}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleProductAvailability(p.id, p.isAvailable ?? true)
                                        }
                                        className={cn(
                                          "px-2 py-0.5 rounded-md text-xs font-bold transition-colors cursor-pointer",
                                          p.isAvailable !== false
                                            ? "bg-success-subtle text-success hover:bg-success-subtle"
                                            : "bg-danger-subtle text-danger hover:bg-danger-subtle"
                                        )}
                                        title={`Click to mark ${p.isAvailable !== false ? "Out of Stock" : "In Stock"}`}
                                      >
                                        {p.isAvailable !== false ? "In Stock" : "Sold Out"}
                                      </button>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Edit"
                                        onClick={() => {
                                          sounds.tap();
                                          setProductModalStore(store);
                                          setEditingProduct(p);
                                          setProdName(p.name);
                                          setProdPrice(String(p.price));
                                          setProdOriginalPrice(
                                            p.originalPrice ? String(p.originalPrice) : ""
                                          );
                                          setProdCategory(p.categoryName || "General");
                                          setProdIsVeg(p.isVeg ?? true);
                                        }}
                                      >
                                        <Edit2 aria-hidden />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Delete"
                                        onClick={() => handleDeleteProduct(p.id)}
                                        className="text-danger hover:bg-danger-subtle"
                                      >
                                        <Trash2 aria-hidden />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-fg-muted italic py-2">No products yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-lg border border-dashed border-border bg-surface text-center space-y-3">
          <Store className="size-10 text-fg-muted mx-auto" />
          <h3 className="text-sm font-bold text-fg">No merchants match</h3>
          <p className="text-xs text-fg-muted max-w-sm mx-auto">
            No stores match &quot;{searchQuery}&quot;. Click &quot;Onboard Merchant&quot; above to add a new
            stall or canteens.
          </p>
        </div>
      )}

      {/* ─── MODAL 1: Plaintext Credentials & Password Rotation ─── */}
      {credentialModalStore && (
        <div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90dvh] w-full max-w-md space-y-5 overflow-y-auto rounded-xl border border-border bg-surface-raised p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-success" />
                <h2 className="text-sm font-bold text-fg">Merchant login</h2>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
                onClick={() => {
                  setCredentialModalStore(null);
                  setRevealedPassword(null);
                  setShowPassword(false);
                }}
              >
                <X aria-hidden />
              </Button>
            </div>

            <div className="space-y-3 bg-surface-muted p-4 rounded-lg border border-border">
              <div>
                <p className="text-xs font-bold text-fg-muted">Store Name</p>
                <p className="text-sm font-bold text-fg">{credentialModalStore.name}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-fg-muted">Username</p>
                <p className="text-xs font-mono font-bold text-fg select-all">
                  {credentialModalStore.loginUsername || credentialModalStore.slug}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-fg-muted">Password</p>
                {revealedPassword ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono font-bold text-success select-all">
                      {showPassword ? revealedPassword : "••••••••••••"}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-pressed={showPassword}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-fg-muted leading-relaxed">
                    Stored as a hash and cannot be read back. Use{" "}
                    <span className="font-bold text-fg">Change password</span> to issue a new one — it is
                    shown here once, then never again.
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-fg-muted">Portal URL</p>
                <p className="text-xs font-mono text-fg-muted truncate select-all">
                  https://campusloop.space/merchant-portal/login
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isRotating}
                onClick={() => handleRotateCredentials(credentialModalStore.id)}
                className={cn(buttonVariants({ variant: "outline", size: "md" }), "flex-1")}
              >
                <RefreshCw className={cn("size-3.5", isRotating && "animate-spin")} />
                <span>Change password</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyWhatsApp(credentialModalStore)}
                className={cn(buttonVariants({ variant: "primary", size: "md" }), "flex-1")}
              >
                <Share2 className="size-3.5" />
                <span>Copy WhatsApp message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Add / Edit Product Under Store ─── */}
      {productModalStore && (
        <div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-border bg-surface-raised p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="size-5 text-brand-text" />
                <h2 className="text-sm font-bold text-fg">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
                onClick={() => setProductModalStore(null)}
              >
                <X aria-hidden />
              </Button>
            </div>

            <p className="text-xs text-fg-muted">
              Store: <strong className="text-fg font-bold">{productModalStore.name}</strong>
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div className="space-y-1">
                <span className="text-sm font-medium text-fg">Product name *</span>
                <input
                  aria-label="Product name"
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Butter Paneer Roll or Classmate Notebook"
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-fg">Price (₹) *</span>
                  <input
                    aria-label="Price (₹)"
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="90"
                    className={cn(fieldClassName, "w-full h-11")}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-medium text-fg">MRP (₹)</span>
                  <input
                    aria-label="MRP (₹)"
                    type="number"
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(e.target.value)}
                    placeholder="120"
                    className={cn(fieldClassName, "w-full h-11")}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium text-fg">Category</span>
                <input
                  aria-label="Category"
                  type="text"
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  placeholder="e.g. Rolls, Snacks, Dairy, Stationery"
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-fg">Vegetarian?</span>
                <button
                  type="button"
                  onClick={() => setProdIsVeg((v) => !v)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                    prodIsVeg ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
                  )}
                >
                  {prodIsVeg ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Leaf className="size-3.5" /> Pure Veg
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Flame className="size-3.5" /> Non-Veg
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModalStore(null)}
                  className={cn(buttonVariants({ variant: "outline", size: "md" }), "flex-1")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className={cn(buttonVariants({ variant: "primary", size: "md" }), "flex-1")}
                >
                  {isSavingProduct ? "Saving" : "Save product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
