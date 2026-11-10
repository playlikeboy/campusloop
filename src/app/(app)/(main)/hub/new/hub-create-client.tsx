"use client";

import { ArrowLeft, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { DedicatedHubType } from "@/components/communities/hub-types";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import {
  HUB_CATEGORIES,
  type HubFormValues,
  INITIAL_HUB_VALUES,
  PHOTO_TYPES,
  type SetHubValue,
  TITLE_PLACEHOLDERS,
} from "./hub-create-options";
import { HubPhotoField } from "./hub-photo-field";
import { HubTypeFields } from "./hub-type-fields";

interface HubCreateClientProps {
  initialType?: DedicatedHubType;
  profileId: string;
}

const FORM_ID = "hub-create-form";

function buildPayload(
  hubType: DedicatedHubType,
  title: string,
  description: string,
  v: HubFormValues,
  imageUrl: string | null
) {
  const payload: Record<string, unknown> = { hubType, title, description };
  if (hubType === "lost_found") {
    Object.assign(payload, {
      type: v.lfType,
      location: v.location || "Campus",
      reward: v.reward || null,
      imageUrl: imageUrl || null,
    });
  } else if (hubType === "marketplace") {
    Object.assign(payload, {
      price: parseInt(v.price, 10) || 0,
      condition: v.condition,
      category: v.category,
      hostelLocation: v.hostelLocation || "Campus",
      images: imageUrl ? [imageUrl] : [],
    });
  } else if (hubType === "gaming") {
    Object.assign(payload, {
      gameName: v.gameName,
      mode: v.mode,
      rankTier: v.rankTier || null,
      gamerTag: v.gamerTag || null,
      slotsTotal: parseInt(v.slotsTotal, 10) || 5,
      scheduledAt: v.scheduledAt,
    });
  } else if (hubType === "rideshare") {
    const seats = parseInt(v.totalSeats, 10) || 4;
    Object.assign(payload, {
      origin: v.origin,
      destination: v.destination,
      departureTime: v.departureTime,
      totalSeats: seats,
      availableSeats: seats - 1,
      pricePerSeat: parseInt(v.pricePerSeat, 10) || 0,
    });
  } else if (hubType === "housing") {
    Object.assign(payload, {
      rentPerMonth: parseInt(v.rentPerMonth, 10) || 0,
      distanceFromCampus: v.distanceFromCampus,
      occupancyType: v.occupancyType,
      genderPreference: v.genderPreference,
      location: v.location || "Near campus",
      imageUrl: imageUrl || null,
    });
  } else if (hubType === "academics") {
    Object.assign(payload, {
      resourceType: v.resourceType,
      subjectCode: v.subjectCode,
      subjectName: v.subjectName,
      branch: v.branch,
      semester: parseInt(v.semester, 10) || 1,
      driveUrl: v.driveUrl || null,
    });
  }
  return payload;
}

export function HubCreateClient({ initialType = "lost_found" }: HubCreateClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type") as DedicatedHubType | null;
  const [hubType, setHubType] = useState<DedicatedHubType>(
    queryType && HUB_CATEGORIES.some((c) => c.id === queryType) ? queryType : initialType
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [values, setValues] = useState<HubFormValues>(INITIAL_HUB_VALUES);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const set: SetHubValue = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));
  const activeCategory = HUB_CATEGORIES.find((c) => c.id === hubType) || HUB_CATEGORIES[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Add a title first.");
      return;
    }

    setIsSubmitting(true);
    sounds.tap();
    haptics.light();

    try {
      const res = await fetch("/api/communities/hub/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(hubType, title.trim(), description.trim(), values, imageUrl)),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Couldn't post your listing. Try again.");
      }

      sounds.ting();
      haptics.repost();
      toast.success("Posted");
      router.push(activeCategory.href);
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Couldn't post your listing. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-bg pb-24 text-fg">
      <header className="sticky top-12 z-30 flex items-center justify-between gap-3 border-b border-border bg-bg px-4 py-2 lg:top-0">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back">
            <ArrowLeft />
          </Button>
          <h1 className="truncate text-lg font-semibold text-fg">New post</h1>
        </div>
        <Button type="submit" form={FORM_ID} loading={isSubmitting} disabled={!title.trim()}>
          {!isSubmitting && <Send />}
          Post
        </Button>
      </header>

      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-fg">What are you posting?</legend>
          <div className="flex flex-wrap gap-2">
            {HUB_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Chip
                  key={cat.id}
                  selected={hubType === cat.id}
                  icon={<Icon />}
                  onSelectedChange={() => {
                    setHubType(cat.id);
                    sounds.tap();
                    haptics.light();
                  }}
                >
                  {cat.label}
                </Chip>
              );
            })}
          </div>
        </fieldset>

        <FormField label="Title" required>
          <Input
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={TITLE_PLACEHOLDERS[hubType]}
          />
        </FormField>

        {PHOTO_TYPES.includes(hubType) && <HubPhotoField imageUrl={imageUrl} onChange={setImageUrl} />}

        <HubTypeFields hubType={hubType} values={values} set={set} />

        <FormField label="Details">
          <Textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anything else people should know, and how to reach you"
          />
        </FormField>
      </form>
    </div>
  );
}
