"use client";

import { ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface PhotosTabProps {
  photos: string[];
  isOwnProfile: boolean;
  displayName: string;
  onOpen: (url: string) => void;
}

export function PhotosTab({ photos, isOwnProfile, displayName, onOpen }: PhotosTabProps) {
  const manage = isOwnProfile ? (
    <Button asChild variant="outline" size="sm">
      <Link href="/profile/edit">Edit photos</Link>
    </Button>
  ) : undefined;

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="No photos yet"
        description={isOwnProfile ? "Add a few photos to your profile." : undefined}
        action={manage}
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((url, idx) => (
          <li key={url}>
            <button
              type="button"
              onClick={() => onOpen(url)}
              className="block aspect-square w-full cursor-pointer overflow-hidden rounded-md bg-surface-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Open photo ${idx + 1} of ${photos.length}`}
            >
              <img
                src={url}
                alt={`${displayName}, photo ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      {manage && <div className="flex justify-center">{manage}</div>}
    </div>
  );
}
