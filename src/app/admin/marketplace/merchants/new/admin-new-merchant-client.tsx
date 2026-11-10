"use client";

import { ArrowLeft, Copy, KeyRound, Loader2, RefreshCw, Send, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { CollegeCombobox } from "@/components/common/college-combobox";
import { Button, buttonVariants } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export function AdminNewMerchantClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("food");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [locationPin, setLocationPin] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("20");
  const [minOrderValue, setMinOrderValue] = useState("80");
  const [estimatedPrepTime, setEstimatedPrepTime] = useState("15–20 min");
  const [institutionId, setInstitutionId] = useState("inst_35df75700bb23dd30311ef5f"); // BIT Mesra default
  const [logoUrl, setLogoUrl] = useState(
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=300&fit=crop"
  );
  const [coverUrl, setCoverUrl] = useState(
    "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=1200&h=400&fit=crop"
  );

  // Portal Credentials
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load institutions list
  const { data: collegesData } = useSWR<{ institutions: any[] }>("/api/colleges?limit=200", fetcher);
  const institutions = collegesData?.institutions || [];

  useEffect(() => {
    if (!loginPassword) {
      handleGeneratePassword();
    }
  }, []);

  function handleNameChange(newName: string) {
    setName(newName);
    if (!loginUsername) {
      const suggested = newName.toLowerCase().replace(/[^a-z0-9]/g, "");
      setLoginUsername(suggested);
    }
  }

  function handleGeneratePassword() {
    sounds.pop();
    haptics.light();
    // crypto.getRandomValues, not Math.random — this string is a credential,
    // and Math.random is neither uniform nor unpredictable.
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    let rand = "";
    for (const byte of bytes) rand += chars[byte % chars.length];
    setLoginPassword(`cl-${rand.slice(0, 5)}-${rand.slice(5)}`);
  }

  function handleCopyCredentials() {
    sounds.tap();
    haptics.medium();
    const text = `CampusLoop Merchant Portal Access\nStore: ${name || "Your Store"}\nPortal Login: https://campusloop.space/merchant-portal/login\nUsername: ${loginUsername}\nPassword: ${loginPassword}\n\nInstall on your phone or open in browser to manage your store!`;
    navigator.clipboard.writeText(text);
    toast.success("Login details copied");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !address.trim()) {
      toast.error("Add a store name and an address first.");
      return;
    }

    sounds.send();
    haptics.success();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/marketplace/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categorySlug,
          description: description.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim(),
          locationPin: locationPin.trim() || undefined,
          deliveryFee: parseInt(deliveryFee, 10) || 0,
          minOrderValue: parseInt(minOrderValue, 10) || 0,
          estimatedPrepTime: estimatedPrepTime.trim(),
          institutionId,
          logoUrl: logoUrl.trim(),
          coverUrl: coverUrl.trim(),
          loginUsername: loginUsername.trim() || undefined,
          loginPassword: loginPassword.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to onboard merchant");

      toast.success("Merchant added");
      router.push("/admin/marketplace");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create merchant");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-5">
        <Link
          href="/admin/marketplace"
          aria-label="Back to marketplace"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft aria-hidden />
        </Link>
        <div>
          <h1 className="text-2xl text-fg">Add a merchant</h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">Add a local store and create its login.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Business Information */}
        <div className="p-5 rounded-lg bg-surface border border-border space-y-3.5">
          <h2 className="text-xs font-bold text-fg-muted flex items-center gap-1.5">
            <Store className="size-4 text-success" />
            <span>1. Business Information &amp; Vertical</span>
          </h2>

          <div className="space-y-1.5">
            <span className="text-sm font-medium text-fg">Store name *</span>
            <input
              aria-label="Store name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Momo House"
              className={cn(fieldClassName, "w-full h-11")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-fg">Type *</span>
              <select
                aria-label="Type"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className={cn(fieldClassName, "w-full h-11")}
              >
                <option value="food">Food</option>
                <option value="rentals">Bike rentals</option>
                <option value="barber">Salon</option>
                <option value="laundry">Laundry</option>
                <option value="water">20L Water Can Delivery (Instant &amp; Pass)</option>
                <option value="essentials">Grocery</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-fg-muted">College *</span>
              <CollegeCombobox
                value={institutionId}
                initialInstitutions={institutions}
                onChange={(id) => setInstitutionId(id)}
                placeholder="Search colleges"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium text-fg">About the store</span>
            <textarea
              aria-label="About the store"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What they sell, prices and opening hours"
              className={cn(fieldClassName, "w-full resize-none py-2.5")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-fg">Logo link</span>
              <input
                aria-label="Logo link"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://"
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
                placeholder="https://"
                className={cn(fieldClassName, "w-full h-11")}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Fulfillment */}
        <div className="p-5 rounded-lg bg-surface border border-border space-y-3.5">
          <h2 className="text-xs font-bold text-fg-muted">2. Campus Location &amp; Contact</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-fg">WhatsApp number</span>
              <input
                aria-label="WhatsApp number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
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
                placeholder="store@domain.com"
                className={cn(fieldClassName, "w-full h-11")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium text-fg">Address *</span>
            <input
              aria-label="Address"
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Hostel 10 gate"
              className={cn(fieldClassName, "w-full h-11")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-fg">Delivery Fee (₹)</span>
              <input
                aria-label="Delivery Fee (₹)"
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className={cn(fieldClassName, "w-full h-11")}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-medium text-fg">Min Order (₹)</span>
              <input
                aria-label="Min Order (₹)"
                type="number"
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
        </div>

        {/* Section 3: Direct Plaintext Credentials Generator */}
        <div className="p-5 rounded-lg bg-surface border border-brand-subtle-border space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-brand-text flex items-center gap-1.5">
              <ShieldCheck className="size-4" />
              <span>3. Direct Portal Login Credentials</span>
            </h2>
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="text-xs font-bold text-brand-text hover:underline flex items-center gap-1 cursor-pointer bg-brand-subtle px-2.5 py-1 rounded-lg border border-brand-subtle-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Copy className="size-3" />
              <span>Copy for WhatsApp</span>
            </button>
          </div>

          <p className="text-xs text-fg-muted leading-relaxed">
            Saved as plain text so you can share it with the shop owner.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-fg">Username</span>
              <input
                aria-label="Username"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="e.g. momohouse"
                className={cn(fieldClassName, "w-full font-mono h-11")}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fg-muted">Password</span>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs font-bold text-brand-text hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <RefreshCw className="size-2.5" />
                  <span>Regenerate</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  aria-label="Login password"
                  type="text"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="e.g. store@k8f2a"
                  className={cn(fieldClassName, "w-full pr-9 font-mono h-11")}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleGeneratePassword}
                  title="Make a password"
                  aria-label="Make a password"
                >
                  <KeyRound aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full")}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Adding merchant</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span>Add merchant</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
