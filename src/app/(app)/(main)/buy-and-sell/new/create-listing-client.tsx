"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bike,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  Compass,
  Eye,
  Home,
  ImagePlus,
  Laptop,
  Loader2,
  MapPin,
  Plus,
  Send,
  Sparkles,
  Tag,
  Wind,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface CreateListingClientProps {
  profileId: string;
}

const CATEGORIES = [
  { id: "Cycles", label: "Cycles & Bikes", icon: Bike, hint: "Gear cycles, mountain bikes, locks" },
  { id: "Textbooks", label: "Textbooks & Notes", icon: BookOpen, hint: "Engineering books, PYQs, GATE" },
  { id: "Coolers", label: "Coolers & Fans", icon: Wind, hint: "Desert coolers, table & clip fans" },
  { id: "Electronics", label: "Electronics", icon: Laptop, hint: "Monitors, keyboards, calculators" },
  { id: "Lab Coats", label: "Drafters & Tools", icon: Compass, hint: "Mini drafters, lab coats, kits" },
  { id: "Furniture", label: "Mattresses & Furniture", icon: Home, hint: "Hostel mattresses, study tables" },
  { id: "Other", label: "Hostel Essentials", icon: Tag, hint: "Kettles, gym weights, organizers" },
] as const;

const CONDITIONS = [
  { id: "BRAND_NEW", label: "Brand New", desc: "Never opened or unused in box" },
  { id: "LIKE_NEW", label: "Like New", desc: "Used gently, zero flaws or scratches" },
  { id: "GOOD", label: "Good Condition", desc: "Working smoothly with minor cosmetic wear" },
  { id: "FAIR", label: "Fair / Used", desc: "Visible wear, completely functional" },
] as const;

const POPULAR_PICKUP_SPOTS = [
  "Central Library Gate",
  "Hostel 7 Common Room",
  "Hostel 11 Entrance",
  "SAC / Food Court",
  "Main Building Kiosk",
  "Campus Main Gate",
];

const STEPS = [
  { step: 1, title: "Category" },
  { step: 2, title: "Details" },
  { step: 3, title: "Pickup" },
  { step: 4, title: "Photos" },
  { step: 5, title: "Preview" },
];

export function CreateListingClient({ profileId }: CreateListingClientProps) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [category, setCategory] = useState<string>("Cycles");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [condition, setCondition] = useState<string>("GOOD");
  const [hostelLocation, setHostelLocation] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const numericPrice = parseInt(price, 10);
  const discountPercent =
    price && originalPrice && Number(originalPrice) > Number(price)
      ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
      : null;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= 4) {
      toast.warning("Maximum 4 photos per listing");
      return;
    }

    const file = files[0];
    const localUrl = URL.createObjectURL(file);
    setImages((prev) => [...prev, localUrl]);
    setIsUploadingImage(true);
    sounds.pop();
    haptics.light();

    try {
      toast.loading("Uploading photo...", { id: "upload-img" });
      const res = await uploadImageToImgBB(file);
      const url = res.displayUrl || res.url;
      setImages((prev) => prev.map((u) => (u === localUrl ? url : u)));
      toast.success("Photo attached", { id: "upload-img" });
    } catch (err) {
      setImages((prev) => prev.filter((u) => u !== localUrl));
      toast.error(err instanceof Error ? err.message : "Failed to upload photo", { id: "upload-img" });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemoveImage(index: number) {
    sounds.tap();
    haptics.light();
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function validateStep(step: number): boolean {
    if (step === 1) {
      return !!category;
    }
    if (step === 2) {
      if (!title.trim()) {
        toast.error("Please enter a title for the item");
        return false;
      }
      if (isNaN(numericPrice) || numericPrice <= 0) {
        toast.error("Please enter a valid price in Rupees");
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!hostelLocation.trim()) {
        toast.error("Please enter a pickup location (e.g. Hostel 11 or Library)");
        return false;
      }
      return true;
    }
    return true;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    sounds.tap();
    haptics.light();
    setCurrentStep((prev) => Math.min(5, prev + 1));
  }

  function prevStep() {
    sounds.tap();
    haptics.light();
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }

  async function handlePublish() {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    sounds.send();
    haptics.success();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/communities/hub/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hubType: "marketplace",
          title: title.trim(),
          description: description.trim() || undefined,
          price: numericPrice,
          originalPrice: originalPrice ? parseInt(originalPrice, 10) : undefined,
          condition,
          category,
          hostelLocation: hostelLocation.trim(),
          isNegotiable,
          images: images.length > 0 ? images : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData?.error || "Failed to create listing");
      }

      toast.success("Listing published to Buy & Sell!");
      mutate((key) => typeof key === "string" && key.includes("/api/communities/feed"));
      router.push("/buy-and-sell");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post listing");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col min-h-screen pb-24 px-4 py-6 sm:px-6 space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (currentStep > 1 ? prevStep() : router.back())}
            className="size-9 p-0 rounded-xl"
            aria-label="Back"
          >
            <ArrowLeft className="size-4.5" />
          </Button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-foreground">List an Item</h1>
            <p className="text-xs text-muted-foreground">Step {currentStep} of 5: {STEPS[currentStep - 1].title}</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                s.step === currentStep
                  ? "w-6 bg-primary"
                  : s.step < currentStep
                  ? "w-2 bg-primary/40"
                  : "w-2 bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Category Selection */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-black text-foreground">What are you selling?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select the category that best matches your item
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    sounds.tap();
                    haptics.light();
                  }}
                  className={cn(
                    "flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border/50 bg-card hover:border-border hover:bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl shrink-0 transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="button" onClick={nextStep} className="font-bold h-11 px-6 gap-2">
              <span>Next: Item Details</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Item Details & Price */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-black text-foreground">Tell us about it</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provide clear details so buyers know what they are getting
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5">
                Item Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hero Sprint 21-Gear Cycle with Lock"
                className="h-11 w-full rounded-xl border border-border/50 bg-card px-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength={80}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5">
                  Selling Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1500"
                    className="h-11 w-full rounded-xl border border-border/50 bg-card pl-8 pr-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Original MRP (₹) <span className="font-normal lowercase">optional</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="4000"
                    className="h-11 w-full rounded-xl border border-border/50 bg-card pl-8 pr-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {discountPercent ? (
              <div className="rounded-xl bg-emerald-500/10 p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ✨ {discountPercent}% discount vs original price!
              </div>
            ) : null}

            {/* Condition Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Condition
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCondition(c.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      condition === c.id
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "border-border/50 bg-card hover:bg-muted/30"
                    )}
                  >
                    <p className="text-xs font-bold text-foreground">{c.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Price negotiation toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card cursor-pointer">
              <div className="min-w-0">
                <span className="text-xs font-bold text-foreground block">Price is Negotiable</span>
                <span className="text-[11px] text-muted-foreground">Open to reasonable student offers</span>
              </div>
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="size-4 rounded accent-primary"
              />
            </label>
          </div>

          <div className="pt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={prevStep} className="font-semibold h-11 px-5">
              Back
            </Button>
            <Button type="button" onClick={nextStep} className="font-bold h-11 px-6 gap-2">
              <span>Next: Pickup Location</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Campus Pickup Spot */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-black text-foreground">Where can buyers collect it?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specify your hostel, department, or a public campus meeting spot
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5">
                Pickup Location *
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-rose-500" />
                <input
                  type="text"
                  value={hostelLocation}
                  onChange={(e) => setHostelLocation(e.target.value)}
                  placeholder="e.g. Hostel 11 or Central Library"
                  className="h-11 w-full rounded-xl border border-border/50 bg-card pl-10 pr-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Popular Campus Spots:</span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_PICKUP_SPOTS.map((spot) => (
                  <button
                    key={spot}
                    type="button"
                    onClick={() => {
                      setHostelLocation(spot);
                      sounds.tap();
                      haptics.light();
                    }}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium border transition",
                      hostelLocation === spot
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border/50 text-foreground hover:bg-muted"
                    )}
                  >
                    {spot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5">
                Description / Notes <span className="font-normal lowercase text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention why you are selling, accessories included (lock, bell), any minor flaws, or preferred pickup times..."
                rows={4}
                className="w-full rounded-xl border border-border/50 bg-card p-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={prevStep} className="font-semibold h-11 px-5">
              Back
            </Button>
            <Button type="button" onClick={nextStep} className="font-bold h-11 px-6 gap-2">
              <span>Next: Add Photos</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Add Photos */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-black text-foreground">Add photos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Items with clear photos sell 3x faster among students
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-border/50 bg-muted/20 group"
                >
                  <img src={img} alt={`Upload ${idx + 1}`} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                  >
                    <X className="size-3.5" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {images.length < 4 && (
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all cursor-pointer"
                >
                  {isUploadingImage ? (
                    <Loader2 className="size-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Camera className="size-6 mb-1 text-primary" />
                      <span className="text-xs font-bold">+ Add Photo</span>
                      <span className="text-[10px] text-muted-foreground">Up to 4</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground">
              💡 Tip: Take photos in good lighting showing any accessories or proof of purchase.
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={prevStep} className="font-semibold h-11 px-5">
              Back
            </Button>
            <Button type="button" onClick={nextStep} className="font-bold h-11 px-6 gap-2">
              <span>Next: Preview Listing</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Preview & Publish */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-black text-foreground">Preview your listing</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review how your listing appears to campus buyers before publishing
            </p>
          </div>

          {/* Live Preview Card */}
          <Card className="overflow-hidden border-2 border-primary/30 p-0 shadow-lg">
            <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between text-xs font-bold text-primary">
              <span className="flex items-center gap-1.5">
                <Eye className="size-3.5" />
                Live Marketplace Preview
              </span>
              <span>Ready to publish</span>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {images.length > 0 ? (
                  <div className="aspect-4/3 sm:w-48 rounded-xl overflow-hidden bg-muted/20 shrink-0">
                    <img src={images[0]} alt={title} className="size-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-4/3 sm:w-48 flex items-center justify-center rounded-xl bg-muted/20 text-muted-foreground shrink-0">
                    <ImagePlus className="size-8" />
                  </div>
                )}

                <div className="space-y-2 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">
                      ₹{numericPrice ? numericPrice.toLocaleString("en-IN") : "0"}
                    </span>
                    {originalPrice ? (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{parseInt(originalPrice, 10).toLocaleString("en-IN")}
                      </span>
                    ) : null}
                    <span className="text-xs font-medium text-muted-foreground">
                      ({isNegotiable ? "Negotiable" : "Fixed"})
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground leading-snug">{title}</h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                      <MapPin className="size-3" />
                      {hostelLocation}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-foreground/80">{category}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {condition.replace("_", " ")}
                    </span>
                  </div>

                  {description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>

          <div className="pt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={prevStep} className="font-semibold h-11 px-5">
              Back
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handlePublish}
              className="font-bold h-11 px-8 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              <span>Publish Listing</span>
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
