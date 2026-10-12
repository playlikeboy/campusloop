"use client";

import {
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle2,
  Gift,
  Glasses,
  Headphones,
  Key,
  Loader2,
  MapPin,
  PackageSearch,
  Send,
  Sparkles,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface Props {
  profileId: string;
  defaultCampusName?: string;
}

const CATEGORIES = [
  { id: "Electronics", label: "Electronics & Audio", icon: Headphones, hint: "Earphones, chargers, laptops, calculators" },
  { id: "ID & Cards", label: "ID Cards & Wallets", icon: Wallet, hint: "College ID, ATM cards, driver's license" },
  { id: "Keys", label: "Keys & Locks", icon: Key, hint: "Hostel room keys, cycle keys, lanyards" },
  { id: "Cycles", label: "Cycles & Bikes", icon: Tag, hint: "Gear cycles, helmets, locks" },
  { id: "Bags", label: "Bags & Backpacks", icon: PackageSearch, hint: "Laptop bags, gym bags, pouches" },
  { id: "Clothing", label: "Clothing & Watches", icon: Glasses, hint: "Jackets, watches, glasses, umbrellas" },
  { id: "Books", label: "Books & Notes", icon: BookOpen, hint: "Textbooks, notebooks, drafters" },
  { id: "Other", label: "Other Essentials", icon: Tag, hint: "Water bottles, sports gear, general items" },
];

const COMMON_CAMPUS_SPOTS = [
  "Central Library",
  "SAC / Food Court",
  "Hostel Common Room",
  "Main Building Kiosk",
  "CAT Hall / Room 204",
  "IC Engine Lab",
  "Campus Main Gate",
  "Sports Ground",
];

export function NewLostFoundClient({ profileId, defaultCampusName = "Campus" }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [type, setType] = useState<"LOST" | "FOUND">("LOST");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [location, setLocation] = useState("");
  const [itemDate, setItemDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    sounds.tap();
    haptics.light();

    try {
      toast.info("Uploading item photo...");
      const result = await uploadImageToImgBB(file);
      if (result?.url) {
        setImageUrl(result.url);
        sounds.pop();
        haptics.medium();
        toast.success("Item photo uploaded!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title for the item.");
      return;
    }

    if (!location.trim()) {
      toast.error("Please specify where the item was lost or found.");
      return;
    }

    setIsSubmitting(true);
    sounds.tap();
    haptics.medium();

    try {
      const res = await fetch("/api/lost-and-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          category,
          location: location.trim(),
          itemDate,
          imageUrl,
          contactInfo: contactInfo.trim() || undefined,
          reward: type === "LOST" && reward.trim() ? reward.trim() : undefined,
        }),
      });

      const data = (await res.json()) as Record<string, any>;
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish report");
      }

      sounds.ting();
      haptics.success();
      toast.success(
        type === "LOST"
          ? "Lost item reported! Scanning campus for potential matches..."
          : "Found item reported! Thank you for helping fellow students."
      );

      const targetSlug = data.slug || data.item?.slug || data.item?.id;
      if (targetSlug) {
        router.push(`/lost-and-found/${targetSlug}`);
      } else {
        router.push("/lost-and-found");
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish report");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col min-h-screen pb-28 border-x border-border/20 bg-background text-foreground select-none">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-12 lg:top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-tight text-foreground">
              Report {type === "LOST" ? "Lost" : "Found"} Item
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Verified campus recovery • {defaultCampusName}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !location.trim()}
          className="h-8 px-4 rounded-full text-xs font-black bg-primary text-primary-foreground hover:bg-primary/95 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin mr-1" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Send className="size-3.5 mr-1" />
              <span>Publish</span>
            </>
          )}
        </Button>
      </header>

      {/* ─── Form Body ─── */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        {/* Type Toggle: LOST vs FOUND */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            What are you reporting?
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted/30 border border-border/40">
            <button
              type="button"
              onClick={() => {
                setType("LOST");
                sounds.tap();
                haptics.light();
              }}
              className={cn(
                "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                type === "LOST"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PackageSearch className="size-4" />
              <span>I Lost Something</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType("FOUND");
                sounds.tap();
                haptics.light();
              }}
              className={cn(
                "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                type === "FOUND"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckCircle2 className="size-4" />
              <span>I Found Something</span>
            </button>
          </div>
        </div>

        {/* ─── Photo Upload Area ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Item Photo (Recommended)
            </label>
            <span className="text-[10px] text-muted-foreground">
              Photos increase recovery rate by 85%
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          {imageUrl ? (
            <div className="relative aspect-16/9 w-full rounded-2xl overflow-hidden border border-border bg-card group">
              <img src={imageUrl} alt="Uploaded item" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute top-3 right-3 size-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
                title="Remove photo"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => !isUploadingImage && fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/70 rounded-2xl bg-card hover:bg-muted/30 transition-all cursor-pointer group text-center space-y-2",
                isUploadingImage && "opacity-60 cursor-not-allowed"
              )}
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="size-8 text-primary animate-spin" />
                  <p className="text-xs font-bold text-foreground">Compressing &amp; uploading...</p>
                </>
              ) : (
                <>
                  <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Camera className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Upload photo or take picture
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      JPG, PNG, WebP up to 15MB (auto-compressed)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Title Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Item Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "LOST"
                ? "e.g. boAt Airdopes 141 (Black Case, Right Earbud Missing)"
                : "e.g. Titan Watch with black leather strap found in Library"
            }
            className="w-full h-11 px-4 rounded-xl border border-border/60 bg-card text-sm font-bold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1",
                    isSelected
                      ? "bg-primary/10 border-primary text-primary shadow-2xs font-bold"
                      : "bg-card border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="text-xs font-bold leading-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campus Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Campus Location *
            </label>
            <span className="text-[10px] text-muted-foreground">Be as specific as possible</span>
          </div>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-rose-500" />
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Central Library 2nd Floor, Near CS Rack 14"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/60 bg-card text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Quick Spots */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-muted-foreground font-semibold">Quick picks:</span>
            {COMMON_CAMPUS_SPOTS.map((spot) => (
              <button
                key={spot}
                type="button"
                onClick={() => setLocation(spot)}
                className="px-2.5 py-1 rounded-lg bg-muted/40 hover:bg-muted border border-border/40 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {spot}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Reward Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Date {type === "LOST" ? "Lost" : "Found"}
            </label>
            <input
              type="date"
              value={itemDate}
              onChange={(e) => setItemDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border/60 bg-card text-xs font-semibold text-foreground outline-none focus:border-primary"
            />
          </div>

          {type === "LOST" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Gift className="size-3.5 text-amber-500" />
                <span>Optional Reward for Finder</span>
              </label>
              <input
                type="text"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="e.g. ₹500 or Canteen Coffee Treat"
                className="w-full h-10 px-3 rounded-xl border border-border/60 bg-card text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Description & Distinctive Features */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Distinctive Marks &amp; Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Red Spider-Man keychain attached, small scratch on the left corner, brand name worn off..."
            className="w-full p-3 rounded-xl border border-border/60 bg-card text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary leading-relaxed resize-none"
          />
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Contact Method (Optional override)
          </label>
          <input
            type="text"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="Defaults to your CampusLoop Chat. Add WhatsApp if preferred."
            className="w-full h-10 px-3 rounded-xl border border-border/60 bg-card text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !location.trim()}
            className="w-full h-11 rounded-full font-black text-xs bg-primary text-primary-foreground hover:bg-primary/95 shadow-md gap-2 cursor-pointer active:scale-98"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Publishing &amp; Scanning Similarity Matches...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Publish Report &amp; Check Matches</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
