"use client";

import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

export const MAX_GALLERY_PHOTOS = 6;

interface GallerySectionProps {
  photos: string[];
  isUploading: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/** Up to 6 photos shown on your profile and your Campus Match card. */
export function GallerySection({ photos, isUploading, onAdd, onRemove }: GallerySectionProps) {
  return (
    <section className="space-y-3" aria-labelledby="gallery-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="gallery-title" className="text-lg text-fg">
            Photos
          </h2>
          <p className="text-sm text-fg-muted">Shown on your profile and your Campus Match card.</p>
        </div>
        <Badge variant="neutral">
          {photos.length}/{MAX_GALLERY_PHOTOS}
        </Badge>
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <li key={url} className="relative aspect-square overflow-hidden rounded-md bg-surface-muted">
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <Badge variant="neutral" className="absolute bottom-1.5 left-1.5">
                Main
              </Badge>
            )}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 flex size-9 cursor-pointer items-center justify-center rounded-full bg-surface text-fg shadow-sm transition-ui hover:text-danger"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </li>
        ))}
        {photos.length < MAX_GALLERY_PHOTOS && (
          <li>
            <button
              type="button"
              disabled={isUploading}
              onClick={onAdd}
              className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border-strong text-sm font-medium text-fg-muted transition-ui hover:border-brand hover:text-brand-text disabled:opacity-50"
            >
              {isUploading ? (
                <Spinner size="md" label="Uploading photo" />
              ) : (
                <>
                  <Plus aria-hidden="true" className="size-5" />
                  Add photo
                </>
              )}
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
