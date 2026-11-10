"use client";

import { Camera, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface PhotoPickerProps {
  /** Current photo URLs. */
  photos: string[];
  onChange: (photos: string[]) => void;
  /** 1 for a single cover photo. */
  max?: number;
  label?: string;
  className?: string;
}

/** Tap-to-add photo tiles with upload progress and a remove button on each photo. */
export function PhotoPicker({ photos, onChange, max = 1, label = "Add photo", className }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    sounds.pop();
    haptics.light();
    try {
      const res = await uploadImageToImgBB(file);
      const url = res.displayUrl || res.url;
      onChange(max === 1 ? [url] : [...photos, url].slice(0, max));
    } catch {
      toast.error("Photo didn't upload. Check your internet and try a smaller photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {photos.map((url, i) => (
        <div
          key={url}
          className="relative size-24 overflow-hidden rounded-md border border-border bg-surface-muted"
        >
          <img src={url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
          <button
            type="button"
            aria-label={`Remove photo ${i + 1}`}
            onClick={() => onChange(photos.filter((p) => p !== url))}
            className="absolute top-1 right-1 flex size-10 cursor-pointer items-center justify-center rounded-full bg-surface text-fg shadow-xs transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      {photos.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border-strong bg-surface text-sm text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-wait"
        >
          {uploading ? <Spinner label="Uploading photo" /> : <Camera className="size-5" />}
          <span>{uploading ? "Uploading" : label}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
