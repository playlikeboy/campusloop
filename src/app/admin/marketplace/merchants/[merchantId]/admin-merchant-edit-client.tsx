"use client";

import {
  ArrowLeft,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Lock,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useEscapeKey } from "@/app/admin/_components/use-escape-key";
import { CampusQrCode } from "@/components/common/campus-qr-code";
import { Button, buttonVariants } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

interface AdminMerchantEditClientProps {
  merchantId: string;
}

type TabType = "profile" | "credentials" | "products" | "orders" | "reviews" | "qr";

export function AdminMerchantEditClient({ merchantId }: AdminMerchantEditClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  const { data, isLoading, mutate } = useSWR<{ merchant: any }>(
    `/api/admin/marketplace/merchants/${merchantId}`,
    fetcher,
    { dedupingInterval: 6000 }
  );

  const { data: reviewsData, mutate: mutateReviews } = useSWR<{
    reviews: any[];
    totalCount: number;
    averageRating: string;
    distribution: Record<number, number>;
  }>(`/api/marketplace/store/${merchantId}/reviews`, fetcher);

  const merchant = data?.merchant;

  // Form states
  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("food");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [locationPin, setLocationPin] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [upiId, setUpiId] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("20");
  const [minOrderValue, setMinOrderValue] = useState("80");
  const [estimatedPrepTime, setEstimatedPrepTime] = useState("15–20 min");
  const [isOpen, setIsOpen] = useState(true);
  const [status, setStatus] = useState("ACTIVE");
  const [isSaving, setIsSaving] = useState(false);

  // Credentials states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  // Initialize form when data loads
  const [formInitialized, setFormInitialized] = useState(false);
  if (merchant && !formInitialized) {
    setName(merchant.name || "");
    setCategorySlug(merchant.categorySlug || "food");
    setDescription(merchant.description || "");
    setAddress(merchant.address || "");
    setLocationPin(merchant.locationPin || "");
    setPhone(merchant.phone || "");
    setEmail(merchant.email || "");
    setUpiId(merchant.upiId || "");
    setLogoUrl(
      merchant.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=300&fit=crop"
    );
    setCoverUrl(
      merchant.coverUrl ||
        "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=1200&h=400&fit=crop"
    );
    setDeliveryFee(String(merchant.deliveryFee ?? 20));
    setMinOrderValue(String(merchant.minOrderValue ?? 80));
    setEstimatedPrepTime(merchant.estimatedPrepTime || "15–20 min");
    setIsOpen(Boolean(merchant.isOpen));
    setStatus(merchant.status || "ACTIVE");
    setLoginUsername(merchant.loginUsername || merchant.slug || "");
    setLoginPassword(merchant.loginPassword || "canteen@password123");
    setFormInitialized(true);
  }

  // Product Add / Edit modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  useEscapeKey(isProductModalOpen, () => setIsProductModalOpen(false));
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOriginalPrice, setProdOriginalPrice] = useState("");
  const [prodCategory, setProdCategory] = useState("General");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodIsVeg, setProdIsVeg] = useState(true);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Product search filter
  const [productSearch, setProductSearch] = useState("");

  const productsList = useMemo(() => {
    const prods = merchant?.products || [];
    if (!productSearch.trim()) return prods;
    const q = productSearch.toLowerCase();
    return prods.filter(
      (p: any) => p.name?.toLowerCase().includes(q) || p.categoryName?.toLowerCase().includes(q)
    );
  }, [merchant?.products, productSearch]);

  function handleGeneratePassword() {
    sounds.pop();
    haptics.light();
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setLoginPassword(`cl_${rand}!`);
    toast.success("New password made. Select Save login to apply it.");
  }

  function handleCopyCredentials() {
    sounds.tap();
    // Only include a password if the admin has just typed one — there is
    // nothing readable stored to fall back on.
    const passwordLine = loginPassword.trim()
      ? `\nPassword: ${loginPassword.trim()}`
      : "\nPassword: (unchanged — set a new one above to share it)";
    const text = `CampusLoop Merchant Portal Credentials\nStore: ${name}\nLogin URL: https://campusloop.space/merchant-portal/login\nUsername: ${loginUsername}${passwordLine}`;
    navigator.clipboard.writeText(text);
    toast.success("Login details copied");
  }

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!loginUsername.trim()) {
      toast.error("Add a username first.");
      return;
    }

    setIsSavingCredentials(true);
    sounds.tap();
    haptics.medium();

    try {
      const res = await fetch(`/api/admin/marketplace/merchants/${merchantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginUsername: loginUsername.trim().toLowerCase(),
          // Omitted when blank, which the API reads as "leave it unchanged".
          loginPassword: loginPassword.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update credentials");

      sounds.ting();
      haptics.success();
      toast.success("Login saved");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update credentials");
    } finally {
      setIsSavingCredentials(false);
    }
  }

  async function handleSaveMerchant(e: React.FormEvent) {
    e.preventDefault();
    sounds.tap();
    haptics.light();
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/marketplace/merchants/${merchantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categorySlug,
          description: description.trim(),
          address: address.trim(),
          locationPin: locationPin.trim(),
          phone: phone.trim(),
          email: email.trim(),
          upiId: upiId.trim(),
          logoUrl: logoUrl.trim(),
          coverUrl: coverUrl.trim(),
          deliveryFee: parseInt(deliveryFee, 10) || 0,
          minOrderValue: parseInt(minOrderValue, 10) || 0,
          estimatedPrepTime: estimatedPrepTime.trim(),
          isOpen,
          status,
        }),
      });

      if (!res.ok) throw new Error("Failed to update merchant");

      sounds.ting();
      haptics.success();
      toast.success("Store saved");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenAddProduct() {
    sounds.tap();
    setEditingProduct(null);
    setProdName("");
    setProdDesc("");
    setProdPrice("");
    setProdOriginalPrice("");
    setProdCategory("General");
    setProdImageUrl("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop");
    setProdIsVeg(true);
    setIsProductModalOpen(true);
  }

  function handleOpenEditProduct(p: any) {
    sounds.tap();
    setEditingProduct(p);
    setProdName(p.name || "");
    setProdDesc(p.description || "");
    setProdPrice(String(p.price ?? ""));
    setProdOriginalPrice(p.originalPrice ? String(p.originalPrice) : "");
    setProdCategory(p.categoryName || "General");
    setProdImageUrl(p.imageUrl || "");
    setProdIsVeg(p.isVeg ?? true);
    setIsProductModalOpen(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice.trim()) {
      toast.error("Add a product name and price first.");
      return;
    }

    setIsSubmittingProduct(true);
    sounds.tap();

    try {
      if (editingProduct) {
        const res = await fetch("/api/admin/marketplace/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            name: prodName.trim(),
            description: prodDesc.trim(),
            price: parseInt(prodPrice, 10) || 0,
            originalPrice: prodOriginalPrice ? parseInt(prodOriginalPrice, 10) : null,
            categoryName: prodCategory.trim(),
            imageUrl: prodImageUrl.trim(),
            isVeg: prodIsVeg,
          }),
        });

        if (!res.ok) throw new Error("Failed to update product");
        toast.success("Product saved");
      } else {
        const res = await fetch("/api/admin/marketplace/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantId,
            name: prodName.trim(),
            description: prodDesc.trim(),
            price: parseInt(prodPrice, 10) || 0,
            originalPrice: prodOriginalPrice ? parseInt(prodOriginalPrice, 10) : null,
            categoryName: prodCategory.trim(),
            imageUrl: prodImageUrl.trim(),
            isVeg: prodIsVeg,
          }),
        });

        if (!res.ok) throw new Error("Failed to create product");
        toast.success("Product added");
      }

      mutate();
      setIsProductModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setIsSubmittingProduct(false);
    }
  }

  async function handleToggleStock(p: any) {
    sounds.pop();
    haptics.light();
    try {
      await fetch("/api/admin/marketplace/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          isAvailable: !p.isAvailable,
        }),
      });
      toast.success(p.isAvailable ? "Marked Out of Stock" : "Marked In Stock");
      mutate();
    } catch {}
  }

  async function handleDeleteProduct(p: any) {
    if (!confirm(`Delete "${p.name}" from menu?`)) return;
    sounds.pop();
    haptics.heavy();
    try {
      await fetch(`/api/merchant/products?id=${p.id}`, { method: "DELETE" });
      toast.success("Product removed");
      mutate();
    } catch {
      toast.error("Couldn't delete the product. Try again.");
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-surface-muted rounded-lg" />
        <div className="h-64 w-full bg-surface-muted rounded-lg" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <p className="text-sm font-bold text-fg">Merchant not found</p>
        <Link href="/admin/marketplace" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 select-none">
      {/* ─── Top Store Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/marketplace"
            aria-label="Back to marketplace"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeft aria-hidden />
          </Link>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-lg border border-border bg-surface-muted overflow-hidden shrink-0">
              <img src={merchant.logoUrl} alt={merchant.name} className="size-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-fg truncate">{merchant.name}</h1>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold",
                    merchant.status === "ACTIVE"
                      ? "bg-success-subtle text-success border border-success/30"
                      : "bg-danger-subtle text-danger border border-danger/30"
                  )}
                >
                  {merchant.status}
                </span>
              </div>
              <p className="text-xs text-fg-muted font-medium truncate">
                {merchant.institution?.name?.split(",")[0] || "BIT Mesra"} · {merchant.categorySlug} ·{" "}
                <Star className="inline size-3 fill-warning text-warning" aria-hidden="true" />{" "}
                {merchant.rating} ({merchant.reviewCount} reviews)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/marketplace/store/${merchant.id}`}
            target="_blank"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <span>View store</span>
            <ExternalLink className="size-3" />
          </Link>

          <Link
            href="/merchant-portal/login"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-success/30 bg-success-subtle text-success text-xs font-bold hover:bg-success-subtle transition-colors"
          >
            <KeyRound className="size-3.5" />
            <span>Open merchant login</span>
          </Link>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto no-scrollbar">
        {[
          { id: "profile", label: "Store Profile", icon: Store },
          { id: "credentials", label: "Credentials & Auth", icon: KeyRound },
          { id: "products", label: `Catalog (${merchant.products?.length || 0})`, icon: Package },
          { id: "orders", label: `Orders (${merchant.orders?.length || 0})`, icon: ShoppingBag },
          {
            id: "reviews",
            label: `Reviews (${reviewsData?.totalCount || merchant.reviewCount || 0})`,
            icon: Star,
          },
          { id: "qr", label: "Table Poster QR", icon: QrCode },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sounds.tap();
                setActiveTab(tab.id as any);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0",
                isActive
                  ? "bg-brand text-brand-fg font-bold"
                  : "text-fg-muted hover:text-fg hover:bg-surface-muted"
              )}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: Profile & Details (pfp, bg pic, address, info) ─── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveMerchant} className="space-y-4">
          {/* Visual Assets Preview Card */}
          <div className="p-5 rounded-lg bg-surface border border-border space-y-4">
            <h2 className="text-xs font-bold text-fg-muted flex items-center gap-1.5">
              <ImageIcon className="size-3.5 text-brand-text" />
              <span>Logo and banner</span>
            </h2>

            {/* Live Visual Preview */}
            <div className="relative rounded-lg border border-border overflow-hidden bg-surface-muted h-36 sm:h-44 flex items-end p-4">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
              ) : null}
              <div aria-hidden className="absolute inset-0 bg-linear-to-t from-overlay to-transparent" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg border-2 border-surface bg-surface">
                  <img src={logoUrl} alt="" className="size-full object-cover" />
                </div>
                <div className="text-story-field-fg">
                  <h3 className="text-base font-bold leading-tight">{name || "Store name"}</h3>
                  <p className="text-xs font-medium text-story-field-muted">
                    {categorySlug} · {address || "Campus location"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Logo link</span>
                <input
                  aria-label="Logo link"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/"
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Banner link</span>
                <input
                  aria-label="Banner link"
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/"
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-surface border border-border space-y-4">
            <h2 className="text-xs font-bold text-fg-muted">Store details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Store Name *</span>
                <input
                  aria-label="Store Name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Category *</span>
                <select
                  aria-label="Category"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                >
                  <option value="food">Food</option>
                  <option value="rentals">Bike rentals</option>
                  <option value="barber">Salon</option>
                  <option value="laundry">Laundry</option>
                  <option value="water">20L Water Delivery</option>
                  <option value="essentials">Grocery</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-medium text-fg">Description</span>
              <textarea
                aria-label="Description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cn(fieldClassName, "w-full resize-none py-2.5")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Address *</span>
                <input
                  aria-label="Address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Landmark</span>
                <input
                  aria-label="Landmark"
                  type="text"
                  value={locationPin}
                  onChange={(e) => setLocationPin(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Phone</span>
                <input
                  aria-label="Phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Email</span>
                <input
                  aria-label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">UPI ID</span>
                <input
                  aria-label="UPI ID"
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="paytm@upi"
                  className={cn(fieldClassName, "w-full font-mono h-11")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Delivery Fee (₹)</span>
                <input
                  aria-label="Delivery Fee (₹)"
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Minimum order (₹)</span>
                <input
                  aria-label="Minimum order (₹)"
                  type="number"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium text-fg">Prep time</span>
                <input
                  aria-label="Prep time"
                  type="text"
                  value={estimatedPrepTime}
                  onChange={(e) => setEstimatedPrepTime(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-border">
                <span className="text-xs font-bold text-fg">Status</span>
                <select
                  aria-label="Store status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={cn(fieldClassName, "h-11")}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="CLOSED">Closed</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-border">
                <span className="text-xs font-bold text-fg">Store is open</span>
                <button
                  type="button"
                  onClick={() => setIsOpen((prev) => !prev)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                    isOpen
                      ? "bg-success-subtle text-success border border-success/30"
                      : "bg-danger-subtle text-danger border border-danger/30"
                  )}
                >
                  {isOpen ? "OPEN NOW" : "CLOSED"}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full")}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Save store</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ─── TAB 2: Credentials & Portal Login (Username + Password) ─── */}
      {activeTab === "credentials" && (
        <div className="space-y-5">
          <div className="p-5 rounded-lg bg-surface border border-success/30 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-success" />
                <h2 className="text-xs font-bold text-fg">Merchant login</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  <Copy className="size-3.5" />
                  <span>Copy login details</span>
                </button>
              </div>
            </div>

            {/* Quick Access Details Box */}
            <div className="p-4 rounded-lg bg-surface-muted border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-fg-muted font-medium">Login page:</span>
                <Link
                  href="/merchant-portal/login"
                  target="_blank"
                  className="font-mono font-bold text-brand-text hover:underline flex items-center gap-1"
                >
                  <span>https://campusloop.space/merchant-portal/login</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-fg-muted font-medium">Username:</span>
                <span className="font-mono font-bold text-fg bg-surface px-2 py-0.5 rounded-md border border-border">
                  @{loginUsername || merchant?.loginUsername || merchant?.slug || "arman"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-fg-muted font-medium">Default password:</span>
                <span className="font-mono font-bold text-success bg-success-subtle px-2 py-0.5 rounded-md border border-success/20">
                  canteen@password123
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-fg-muted flex items-center gap-1">
                    <User className="size-3" />
                    <span>Username</span>
                  </span>
                  <input
                    aria-label="Login username"
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className={cn(fieldClassName, "w-full font-mono h-11")}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-fg-muted flex items-center gap-1">
                      <Lock className="size-3" />
                      <span>New password</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.tap();
                          haptics.light();
                          setLoginPassword("canteen@password123");
                          setShowPassword(true);
                          toast.info("Password set to the default. Select Save login to apply it.");
                        }}
                        className="text-xs font-bold text-success hover:underline cursor-pointer"
                      >
                        Set Default (canteen@password123)
                      </button>
                      <span className="text-fg-muted text-xs">·</span>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-xs font-bold text-brand-text hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <RefreshCw className="size-2.5" />
                        <span>Random</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      aria-label="New password"
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Leave blank to keep the current password"
                      autoComplete="new-password"
                      className={cn(fieldClassName, "w-full pr-20 font-mono h-11")}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
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
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/merchant-portal/login"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-text hover:underline"
                >
                  <span>Open merchant login</span>
                  <ExternalLink className="size-3" />
                </Link>

                <button
                  type="submit"
                  disabled={isSavingCredentials}
                  className={buttonVariants({ variant: "primary", size: "md" })}
                >
                  {isSavingCredentials ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="size-3.5" />
                  )}
                  <span>Save login</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Products Catalog CRUD ─── */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
              <input
                aria-label="Search menu items"
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search menu items"
                className={cn(fieldClassName, "w-full pl-9 pr-3 h-11")}
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddProduct}
              className={cn(buttonVariants({ variant: "primary", size: "sm" }), "shrink-0")}
            >
              <Plus className="size-3.5 stroke-2" />
              <span>Add item</span>
            </button>
          </div>

          <div className="rounded-lg bg-surface border border-border overflow-hidden divide-y divide-border">
            {productsList.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Package className="size-8 mx-auto text-fg-muted" />
                <p className="text-xs font-bold text-fg">No items yet</p>
                <p className="text-xs text-fg-muted">Add items so students can order them.</p>
              </div>
            ) : (
              productsList.map((p: any) => (
                <div
                  key={p.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-surface-muted transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="size-12 rounded-lg bg-surface-muted overflow-hidden shrink-0 border border-border">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-fg-muted">
                          <UtensilsCrossed className="size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-fg truncate">{p.name}</span>
                        <span className="text-xs font-bold text-fg-muted bg-surface-muted px-1.5 py-0.5 rounded">
                          {p.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-fg-muted mt-0.5">
                        <span className="font-bold text-fg">₹{p.price}</span>
                        {p.originalPrice && <span className="line-through text-xs">₹{p.originalPrice}</span>}
                        <span>
                          ·{" "}
                          {p.isAvailable ? (
                            <span className="inline-flex items-center gap-1 text-success font-bold text-xs">
                              <span className="size-1.5 rounded-full bg-success inline-block" /> In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-danger font-bold text-xs">
                              <span className="size-1.5 rounded-full bg-danger inline-block" /> Out of Stock
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStock(p)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
                        p.isAvailable
                          ? "bg-success-subtle text-success border-success/30 hover:bg-success-subtle"
                          : "bg-danger-subtle text-danger border-danger/30 hover:bg-danger-subtle"
                      )}
                    >
                      {p.isAvailable ? "In Stock" : "Out of Stock"}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleOpenEditProduct(p)}
                      title="Edit item"
                      aria-label="Edit item"
                    >
                      <Edit2 aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteProduct(p)}
                      title="Delete item"
                      aria-label="Delete item"
                      className="hover:bg-danger-subtle hover:text-danger"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Live Orders ─── */}
      {activeTab === "orders" && (
        <div className="rounded-lg bg-surface border border-border overflow-hidden divide-y divide-border">
          {(merchant.orders || []).length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <ShoppingBag className="size-8 mx-auto text-fg-muted" />
              <p className="text-xs font-bold text-fg">No orders yet</p>
            </div>
          ) : (
            merchant.orders.map((o: any) => (
              <div key={o.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-fg">#{o.orderNumber || o.id.slice(0, 8)}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-subtle text-brand-text border border-brand-subtle-border">
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-fg-muted">
                    ₹{o.total} · {o.paymentMethod || "COD"} · {formatTimeAgo(o.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── TAB 5: Ratings & Student Reviews ─── */}
      {activeTab === "reviews" && (
        <div className="space-y-5">
          {/* Summary Card */}
          <div className="p-5 rounded-lg bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-lg bg-warning-subtle border border-warning/30 flex flex-col items-center justify-center text-warning">
                <span className="text-2xl font-bold">{reviewsData?.averageRating || merchant.rating}</span>
                <span className="text-xs font-bold">/ 5.0</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-fg">Rating</h3>
                <p className="text-xs text-fg-muted">
                  Based on {reviewsData?.totalCount || merchant.reviewCount || 0} verified student reviews
                </p>
                <div className="flex items-center gap-1 mt-1 text-warning">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "size-3.5",
                        s <= Math.round(Number(reviewsData?.averageRating || merchant.rating))
                          ? "fill-warning stroke-warning"
                          : "fill-transparent stroke-fg-subtle"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Link
              href={`/marketplace/store/${merchant.id}`}
              target="_blank"
              className="text-xs font-bold text-brand-text hover:underline flex items-center gap-1"
            >
              <span>See reviews on the store page</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>

          {/* Reviews List */}
          <div className="rounded-lg bg-surface border border-border overflow-hidden divide-y divide-border">
            {(reviewsData?.reviews || []).length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Star className="size-8 mx-auto text-fg-muted" />
                <p className="text-xs font-bold text-fg">No student reviews yet</p>
                <p className="text-xs text-fg-muted">Students can review this store from the store page.</p>
              </div>
            ) : (
              reviewsData?.reviews.map((r: any) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full bg-surface-muted overflow-hidden border border-border">
                        <img
                          src={getAvatarUrl(r.student?.avatarUrl, r.student?.username ?? "student")}
                          alt={r.student?.displayName || "Student"}
                          className="size-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-fg">
                            {r.student?.displayName || "Student"}
                          </span>
                          <span className="text-xs text-fg-muted">@{r.student?.username || "student"}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-warning">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                "size-2.5",
                                s <= r.rating
                                  ? "fill-warning stroke-warning"
                                  : "fill-transparent stroke-fg-subtle/30"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-fg-muted">{formatTimeAgo(r.createdAt)}</span>
                  </div>

                  {r.comment && (
                    <p className="text-xs text-fg leading-relaxed font-medium pl-9">{r.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 6: Table QR Stand ─── */}
      {activeTab === "qr" && (
        <div className="p-8 rounded-lg bg-surface border border-border text-center space-y-4 max-w-sm mx-auto">
          <div className="mx-auto flex items-center justify-center">
            <CampusQrCode
              value={`https://campusloop.space/marketplace/store/${merchant.id}`}
              size={200}
              logoUrl="/logo.png"
              bordered={true}
            />
          </div>
          <div>
            <h3 className="text-base font-bold text-fg">{merchant.name}</h3>
            <p className="text-xs text-fg-muted">Table QR code</p>
          </div>
          <Link
            href="/merchant-portal/store/qr"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            <span>Print A4 QR stand</span>
          </Link>
        </div>
      )}

      {/* ─── Add/Edit Product Modal ─── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-border bg-surface-raised p-5 shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-fg">
                {editingProduct ? "Edit Menu Item" : "Add New Menu Item"}
              </h3>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
                onClick={() => setIsProductModalOpen(false)}
              >
                <X aria-hidden />
              </Button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div className="space-y-1">
                <span className="text-sm font-medium text-fg">Item Name *</span>
                <input
                  aria-label="Item Name"
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Chicken momos (8 pcs)"
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
                    placeholder="120"
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
                    placeholder="150"
                    className={cn(fieldClassName, "w-full h-11")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-fg">Category</span>
                  <input
                    aria-label="Category"
                    type="text"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    placeholder="e.g. Momos"
                    className={cn(fieldClassName, "w-full h-11")}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-medium text-fg">Diet</span>
                  <select
                    aria-label="Diet"
                    value={prodIsVeg ? "veg" : "nonveg"}
                    onChange={(e) => setProdIsVeg(e.target.value === "veg")}
                    className={cn(fieldClassName, "w-full h-11")}
                  >
                    <option value="veg">Pure Veg</option>
                    <option value="nonveg">Non-Veg</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium text-fg">Image URL</span>
                <input
                  aria-label="Image URL"
                  type="url"
                  value={prodImageUrl}
                  onChange={(e) => setProdImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/"
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium text-fg">Description</span>
                <textarea
                  aria-label="Description"
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Ingredients, spice level, serving size"
                  className={cn(fieldClassName, "w-full resize-none py-2.5")}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-fg-muted hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className={buttonVariants({ variant: "primary", size: "sm" })}
                >
                  {isSubmittingProduct && <Loader2 className="size-3 animate-spin" />}
                  <span>{editingProduct ? "Save Item" : "Add Item"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
