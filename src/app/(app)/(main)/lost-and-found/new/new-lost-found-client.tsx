"use client";

import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { PhotoField } from "./photo-field";

interface Props {
  profileId: string;
  defaultCampusName?: string;
}

type ReportType = "LOST" | "FOUND";

const CATEGORIES = [
  { id: "Electronics", label: "Electronics" },
  { id: "ID & Cards", label: "ID and cards" },
  { id: "Keys", label: "Keys" },
  { id: "Cycles", label: "Cycles" },
  { id: "Bags", label: "Bags" },
  { id: "Clothing", label: "Clothes and watches" },
  { id: "Books", label: "Books" },
  { id: "Other", label: "Other" },
] as const;

/** Today as YYYY-MM-DD in the phone's own time zone (toISOString is UTC). */
function todayLocal() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const COMMON_SPOTS = ["Library", "Canteen", "Hostel", "Classroom", "Main gate", "Sports ground"];

export function NewLostFoundClient({ defaultCampusName = "your college" }: Props) {
  const router = useRouter();

  const [type, setType] = useState<ReportType>("LOST");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Electronics");
  const [location, setLocation] = useState("");
  const [itemDate, setItemDate] = useState(todayLocal);
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const titleError =
    triedSubmit && !title.trim() ? 'Say what the item is, like "Black boAt earphones".' : undefined;
  const locationError = triedSubmit && !location.trim() ? 'Say where, like "Library, 2nd floor".' : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTriedSubmit(true);
    if (!title.trim() || !location.trim()) return;

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

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        slug?: string;
        item?: { slug?: string; id?: string };
      };
      if (!res.ok) throw new Error(data.error || "Your report didn't post. Try again in a moment.");

      sounds.ting();
      haptics.success();
      toast.success(
        type === "LOST"
          ? "Posted. We'll show matching found items on your report."
          : "Posted. Thanks for helping."
      );

      const targetSlug = data.slug || data.item?.slug || data.item?.id;
      router.push(targetSlug ? `/lost-and-found/${targetSlug}` : "/lost-and-found");
      router.refresh();
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Your report didn't post. Try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-4 pb-28 sm:pt-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/lost-and-found">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Lost and found
        </Link>
      </Button>

      <header className="mt-3 mb-6 space-y-1">
        <h1 className="text-3xl text-fg">Report an item</h1>
        <p className="text-sm text-fg-muted">Students at {defaultCampusName} will see it.</p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <SegmentedControl<ReportType>
          aria-label="What happened"
          fullWidth
          value={type}
          onChange={(value) => {
            setType(value);
            sounds.tap();
            haptics.light();
          }}
          options={[
            { value: "LOST", label: "I lost something" },
            { value: "FOUND", label: "I found something" },
          ]}
        />

        <FormField label="What is it?" required error={titleError}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-required="true"
            maxLength={100}
            placeholder={
              type === "LOST" ? "Black boAt earphones in a case" : "Silver watch with a black strap"
            }
          />
        </FormField>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-fg">Category</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Chip key={cat.id} size="sm" selected={category === cat.id} onClick={() => setCategory(cat.id)}>
                {cat.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <FormField
            label={type === "LOST" ? "Where did you lose it?" : "Where did you find it?"}
            required
            error={locationError}
          >
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-required="true"
              placeholder="Library, 2nd floor"
            />
          </FormField>
          <fieldset className="flex min-w-0 flex-wrap gap-2">
            <legend className="sr-only">Common places</legend>
            {COMMON_SPOTS.map((spot) => (
              <Chip key={spot} size="sm" selected={location === spot} onClick={() => setLocation(spot)}>
                {spot}
              </Chip>
            ))}
          </fieldset>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="When?">
            <Input
              type="date"
              value={itemDate}
              max={todayLocal()}
              onChange={(e) => setItemDate(e.target.value)}
            />
          </FormField>
          {type === "LOST" && (
            <FormField label="Reward" hint="Optional.">
              <Input
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="₹200 or a canteen treat"
              />
            </FormField>
          )}
        </div>

        <PhotoField value={imageUrl} onChange={setImageUrl} />

        <FormField
          label="Anything that helps identify it?"
          hint="Stickers, scratches, keychains, the name on it."
        >
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Red keychain, small scratch on the case"
          />
        </FormField>

        <FormField
          label="How to reach you"
          hint="Optional. Leave empty and people will message you on CampusLoop."
        >
          <Input
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="WhatsApp number or Instagram"
          />
        </FormField>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {!isSubmitting && <Send className="size-4" aria-hidden="true" />}
          {isSubmitting ? "Posting" : "Post report"}
        </Button>
      </form>
    </div>
  );
}
