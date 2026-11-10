"use client";

import { Percent, Store } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BrandedQrModal } from "@/components/common/branded-qr-modal";
import { MarketplaceCartBar } from "@/components/marketplace/cart-bar";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketplaceCart } from "@/hooks/use-marketplace-cart";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { ItemSheet } from "./item-sheet";
import { StoreHeader } from "./store-header";
import { StoreMenu } from "./store-menu";
import { StoreReviews } from "./store-reviews";

interface StoreClientProps {
  merchantId: string;
  profileId: string;
}

export function StoreClient({ merchantId }: StoreClientProps) {
  const [activeTab, setActiveTab] = useState<string>("menu");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Array<{ name: string; price: number }>>([]);
  const [quantity, setQuantity] = useState(1);

  const { addItem, merchantGroups } = useMarketplaceCart();

  const { data, isLoading, error } = useSWR<{ store: any }>(`/api/marketplace/store/${merchantId}`, fetcher, {
    dedupingInterval: 15000,
  });

  const { data: reviewsData, mutate: mutateReviews } = useSWR<{
    reviews: any[];
    totalCount: number;
    averageRating: string;
    distribution: Record<number, number>;
    userReview: any;
  }>(`/api/marketplace/store/${merchantId}/reviews`, fetcher);

  const [showQrModal, setShowQrModal] = useState(false);

  const store = data?.store;
  const products = store?.products || [];
  const offers = store?.offers || [];
  const reviews = store?.reviews || [];

  // Current store items in cart
  const currentStoreGroup = merchantGroups.find((g) => g.merchantId === merchantId);

  function handleOpenProductModal(product: any) {
    if (!store?.isOpen) {
      toast.error("This store is closed right now.");
      return;
    }
    if (!product.isAvailable) {
      toast.error("This item is sold out.");
      return;
    }

    sounds.tap();
    haptics.light();
    setSelectedProduct(product);
    setQuantity(1);

    const defaults: Record<string, string> = {};
    (product.options || []).forEach((opt: any) => {
      defaults[opt.name] = opt.defaultChoice || opt.choices?.[0] || "";
    });
    setSelectedOptions(defaults);
    setSelectedAddons([]);
  }

  function handleAddonToggle(addon: { name: string; price: number }) {
    sounds.pop();
    haptics.light();
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.name === addon.name);
      if (exists) return prev.filter((a) => a.name !== addon.name);
      return [...prev, addon];
    });
  }

  function handleAddToCart() {
    if (!selectedProduct || !store) return;
    sounds.ting();
    haptics.success();

    addItem({
      productId: selectedProduct.id,
      merchantId: store.id,
      merchantName: store.name,
      merchantSlug: store.slug,
      merchantLogo: store.logoUrl,
      deliveryFee: store.deliveryFee ?? 20,
      freeDeliveryAbove: store.freeDeliveryAbove,
      productName: selectedProduct.name,
      price: selectedProduct.price,
      imageUrl: selectedProduct.imageUrl,
      quantity,
      selectedOptions,
      selectedAddons,
    });

    toast.success(`Added ${quantity} × ${selectedProduct.name} to your cart.`);
    setSelectedProduct(null);
  }

  function handleShareStore() {
    sounds.tap();
    haptics.light();

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://campusloop.space";
    const shareUrl = `${baseUrl}/marketplace/store/${merchantId}`;

    if (navigator.share) {
      navigator
        .share({
          title: store?.name || "Campus Store",
          text: `${store?.name} on CampusLoop`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => toast.success("Link copied."))
        .catch(() => toast.error("Couldn't copy the link."));
    }
  }

  // Calculate modal total
  const modalItemTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    const base = selectedProduct.price;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    return (base + addonsTotal) * quantity;
  }, [selectedProduct, selectedAddons, quantity]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4" aria-busy="true" aria-label="Loading store">
        <Skeleton className="aspect-[3/1] w-full rounded-lg" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <EmptyState
        icon={Store}
        title="This store isn't available"
        description="It may be offline or no longer listed."
        action={
          <Link href="/marketplace" className={buttonVariants({ variant: "primary" })}>
            Browse other stores
          </Link>
        }
      />
    );
  }

  const reviewList = reviewsData?.reviews || reviews || [];
  const infoRows = (
    [
      ["Address", store.address],
      ["Phone", store.phone],
      ["Email", store.email],
      ["Delivery fee", store.deliveryFee != null ? `₹${store.deliveryFee}` : null],
      ["Minimum order", store.minOrderValue != null ? `₹${store.minOrderValue}` : null],
    ] as Array<[string, string | null | undefined]>
  ).filter(([, v]) => !!v);
  const cartCount = currentStoreGroup ? currentStoreGroup.items.reduce((s, i) => s + i.quantity, 0) : 0;
  const cartTotal = currentStoreGroup
    ? currentStoreGroup.items.reduce((s, i) => s + i.price * i.quantity, 0)
    : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-28">
      <StoreHeader
        store={store}
        reviewCount={reviewsData?.totalCount ?? 0}
        averageRating={reviewsData?.averageRating}
        onShare={handleShareStore}
        onShowQr={() => setShowQrModal(true)}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(String(v))} className="gap-4">
        <TabsList variant="line" className="w-full justify-start gap-4 border-b border-border">
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="deals">Offers{offers.length ? ` (${offers.length})` : ""}</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="about">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <StoreMenu products={products} storeOpen={!!store.isOpen} onPick={handleOpenProductModal} />
        </TabsContent>

        <TabsContent value="deals">
          {offers.length > 0 ? (
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
              {offers.map((offer: any) => (
                <li key={offer.id} className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-sans text-sm font-semibold text-fg">{offer.title}</h3>
                    <span className="shrink-0 text-sm font-semibold text-fg tabular-nums">
                      {offer.discountType === "PERCENTAGE"
                        ? `${offer.discountValue}% off`
                        : `₹${offer.discountValue} off`}
                    </span>
                  </div>
                  {offer.description && <p className="text-sm text-fg-muted">{offer.description}</p>}
                  {offer.code && (
                    <p className="text-sm text-fg-muted">
                      Use code{" "}
                      <span className="rounded-sm bg-surface-muted px-1.5 py-0.5 font-mono text-fg">
                        {offer.code}
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="compact" icon={Percent} title="No offers right now" />
          )}
        </TabsContent>

        <TabsContent value="reviews">
          <StoreReviews
            storeId={store.id}
            storeName={store.name}
            fallbackRating={store.rating}
            reviews={reviewList}
            averageRating={reviewsData?.averageRating}
            totalCount={reviewsData?.totalCount}
            hasOwnReview={!!reviewsData?.userReview}
            onSaved={() => mutateReviews()}
          />
        </TabsContent>

        <TabsContent value="about">
          {infoRows.length > 0 ? (
            <dl className="divide-y divide-border rounded-lg border border-border bg-surface text-sm">
              {infoRows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 p-3">
                  <dt className="text-fg-muted">{k}</dt>
                  <dd className="min-w-0 break-words text-right text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <EmptyState size="compact" icon={Store} title="No store details yet" />
          )}
        </TabsContent>
      </Tabs>

      <MarketplaceCartBar count={cartCount} total={cartTotal} />

      <ItemSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        quantity={quantity}
        onQuantity={(d) => setQuantity((q) => Math.max(1, q + d))}
        addons={selectedAddons}
        onToggleAddon={handleAddonToggle}
        total={modalItemTotal}
        onAdd={handleAddToCart}
      />

      <BrandedQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={store.name}
        subtitle={[store.categorySlug, store.locationPin].filter(Boolean).join(" · ") || "Campus store"}
        badgeText="Campus store"
        shortUrl={`https://campusloop.space/marketplace/store/${store.id}`}
        avatarUrl={store.logoUrl}
        category="store"
      />
    </div>
  );
}
