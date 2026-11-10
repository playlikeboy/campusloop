"use client";

import { Camera, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";

interface PhotoFieldProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

/** One optional photo: tap to pick or take a picture, uploads right away. */
export function PhotoField({ value, onChange }: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    sounds.tap();
    haptics.light();
    try {
      const result = await uploadImageToImgBB(file);
      if (result?.url) {
        onChange(result.url);
        sounds.pop();
        haptics.medium();
      }
    } catch (err) {
      toast.error(
        (err instanceof Error && err.message) ||
          "Photo didn't upload. Try a smaller photo or check your connection."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-fg">
        Photo <span className="font-normal text-fg-muted">(optional)</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      {value ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface-muted">
          <img src={value} alt="Your item" className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove photo"
            className="absolute top-2 right-2 flex size-10 cursor-pointer items-center justify-center rounded-full bg-surface text-fg shadow-sm transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface px-4 py-8 text-center transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Spinner size="sm" />
              <span className="text-sm font-semibold text-fg">Uploading photo</span>
            </>
          ) : (
            <>
              <Camera className="size-6 text-brand-text" aria-hidden="true" />
              <span className="text-sm font-semibold text-fg">Add a photo</span>
              <span className="text-xs text-fg-muted">A photo makes the item easier to spot.</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
