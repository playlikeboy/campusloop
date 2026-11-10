"use client";

import { Camera, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";

const MAX_PHOTOS = 4;

interface ListingPhotosProps {
  images: string[];
  onChange: (update: (prev: string[]) => string[]) => void;
}

/** Up to four photos. Each one shows a local preview while it uploads. */
export function ListingPhotos({ images, onChange }: ListingPhotosProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= MAX_PHOTOS) {
      toast.warning(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    onChange((prev) => [...prev, localUrl]);
    setUploading(true);
    sounds.pop();
    haptics.light();

    try {
      const res = await uploadImageToImgBB(file);
      const url = res.displayUrl || res.url;
      onChange((prev) => prev.map((u) => (u === localUrl ? url : u)));
    } catch (err) {
      onChange((prev) => prev.filter((u) => u !== localUrl));
      toast.error(
        err instanceof Error
          ? err.message
          : "Photo didn't upload. Try a smaller photo or check your connection."
      );
    } finally {
      URL.revokeObjectURL(localUrl);
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(index: number) {
    sounds.tap();
    haptics.light();
    onChange((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-semibold text-fg">
        Photos <span className="font-normal text-fg-muted">(up to {MAX_PHOTOS})</span>
      </legend>
      <p className="text-sm text-fg-muted">The first photo is the cover. Use good light.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, idx) => (
          <div
            key={img}
            className="relative aspect-square overflow-hidden rounded-md border border-border bg-surface-muted"
          >
            <img src={img} alt={`Photo ${idx + 1}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(idx)}
              aria-label={`Remove photo ${idx + 1}`}
              className="absolute top-1.5 right-1.5 flex size-10 cursor-pointer items-center justify-center rounded-full bg-surface text-fg shadow-sm transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {images.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong bg-surface text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
          >
            {uploading ? (
              <Spinner size="md" label="Uploading photo" />
            ) : (
              <>
                <Camera className="size-6 text-brand-text" aria-hidden="true" />
                <span className="text-sm font-semibold">Add photo</span>
              </>
            )}
          </button>
        )}
      </div>
    </fieldset>
  );
}
