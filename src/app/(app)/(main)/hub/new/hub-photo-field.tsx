"use client";

import { Camera, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";

interface HubPhotoFieldProps {
  imageUrl: string | null;
  onChange: (url: string | null) => void;
}

export function HubPhotoField({ imageUrl, onChange }: HubPhotoFieldProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
        toast.success("Photo added");
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Couldn't upload the photo. Try a smaller image.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-fg">Photo (optional)</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {imageUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface-muted">
          <img src={imageUrl} alt="Your photo" className="size-full object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => onChange(null)}
            aria-label="Remove photo"
            className="absolute top-3 right-3 bg-surface shadow-xs"
          >
            <X />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border-strong bg-surface-muted p-4 text-left transition-ui hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
            {uploading ? <Spinner size="sm" /> : <Camera className="size-5" aria-hidden="true" />}
          </span>
          <span>
            <span className="block text-sm font-semibold text-fg">
              {uploading ? "Uploading…" : "Add a photo"}
            </span>
            <span className="block text-sm text-fg-muted">JPG, PNG or WebP</span>
          </span>
        </button>
      )}
    </div>
  );
}
