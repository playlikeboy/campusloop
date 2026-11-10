"use client";

import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { ListingPhotos } from "./listing-photos";

interface CreateListingClientProps {
  profileId: string;
}

const CATEGORIES = [
  { id: "Cycles", label: "Cycle" },
  { id: "Textbooks", label: "Books and notes" },
  { id: "Coolers", label: "Cooler or fan" },
  { id: "Electronics", label: "Electronics" },
  { id: "Lab Coats", label: "Drafter or lab gear" },
  { id: "Furniture", label: "Mattress or furniture" },
  { id: "Other", label: "Other" },
] as const;

const CONDITIONS = [
  { id: "BRAND_NEW", label: "New" },
  { id: "LIKE_NEW", label: "Like new" },
  { id: "GOOD", label: "Good" },
  { id: "FAIR", label: "Used" },
] as const;

const COMMON_SPOTS = ["Library", "Canteen", "Hostel gate", "Main gate"];

export function CreateListingClient(_props: CreateListingClientProps) {
  const router = useRouter();
  const negotiableId = useId();

  const [category, setCategory] = useState<string>("Cycles");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [condition, setCondition] = useState<string>("GOOD");
  const [hostelLocation, setHostelLocation] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const numericPrice = Number.parseInt(price, 10);
  const priceValid = Number.isFinite(numericPrice) && numericPrice > 0;
  const uploading = images.some((url) => url.startsWith("blob:"));

  const titleError =
    triedSubmit && !title.trim() ? 'Add a name, like "Hero Sprint cycle with lock".' : undefined;
  const priceError = triedSubmit && !priceValid ? "Enter a price in rupees, like 1500." : undefined;
  const placeError = triedSubmit && !hostelLocation.trim() ? "Say where buyers can pick it up." : undefined;

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setTriedSubmit(true);
    if (!title.trim() || !priceValid || !hostelLocation.trim()) return;
    if (uploading) {
      toast.info("Wait for your photos to finish uploading.");
      return;
    }

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
          originalPrice: originalPrice ? Number.parseInt(originalPrice, 10) : undefined,
          condition,
          category,
          hostelLocation: hostelLocation.trim(),
          isNegotiable,
          images: images.length > 0 ? images : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData?.error || "Your listing didn't post. Try again in a moment.");
      }

      toast.success("Your listing is up");
      mutate((key) => typeof key === "string" && key.includes("/api/communities/feed"));
      router.push("/buy-and-sell");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Your listing didn't post. Try again in a moment.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-4 pb-28 sm:pt-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/buy-and-sell">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Buy and sell
        </Link>
      </Button>

      <header className="mt-3 mb-6 space-y-1">
        <h1 className="text-3xl text-fg">Sell something</h1>
        <p className="text-sm text-fg-muted">Students at your college will see it and can message you.</p>
      </header>

      <form onSubmit={handlePublish} noValidate className="space-y-5">
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-fg">What are you selling?</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Chip key={cat.id} size="sm" selected={category === cat.id} onClick={() => setCategory(cat.id)}>
                {cat.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <FormField label="Name" required error={titleError}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-required="true"
            maxLength={80}
            placeholder="Hero Sprint cycle with lock"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Price (₹)" required error={priceError}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-required="true"
              placeholder="1500"
              className="tabular-nums"
            />
          </FormField>
          <FormField label="Price when new (₹)" hint="Optional.">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="4000"
              className="tabular-nums"
            />
          </FormField>
        </div>

        <div className="flex min-h-11 items-center justify-between gap-3">
          <label htmlFor={negotiableId} className="text-sm font-semibold text-fg">
            Open to offers
          </label>
          <Switch id={negotiableId} checked={isNegotiable} onCheckedChange={setIsNegotiable} />
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-fg">Condition</legend>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <Chip key={c.id} size="sm" selected={condition === c.id} onClick={() => setCondition(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <FormField label="Pickup place" required error={placeError}>
            <Input
              value={hostelLocation}
              onChange={(e) => setHostelLocation(e.target.value)}
              aria-required="true"
              placeholder="Hostel 11 or the library"
            />
          </FormField>
          <fieldset className="flex min-w-0 flex-wrap gap-2">
            <legend className="sr-only">Common pickup places</legend>
            {COMMON_SPOTS.map((spot) => (
              <Chip
                key={spot}
                size="sm"
                selected={hostelLocation === spot}
                onClick={() => setHostelLocation(spot)}
              >
                {spot}
              </Chip>
            ))}
          </fieldset>
        </div>

        <ListingPhotos images={images} onChange={setImages} />

        <FormField label="Details" hint="Optional. Why you're selling, what's included, any flaws.">
          <Textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Comes with a lock and bell. Small scratch on the frame."
          />
        </FormField>

        <Button type="submit" size="lg" loading={isSubmitting} disabled={uploading} className="w-full">
          {!isSubmitting && <Send className="size-4" aria-hidden="true" />}
          {isSubmitting ? "Posting" : "Post listing"}
        </Button>
      </form>
    </div>
  );
}
