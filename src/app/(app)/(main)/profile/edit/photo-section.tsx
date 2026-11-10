"use client";

import { Camera, Crop, ImageIcon, Smile } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAvatarUrl, initialOf } from "@/lib/utils";

interface PhotoSectionProps {
  avatarUrl: string;
  bannerUrl: string;
  displayName: string;
  username: string;
  onUploadAvatar: () => void;
  onCropAvatar: () => void;
  onCartoonAvatar: () => void;
  onUploadBanner: () => void;
  onCropBanner: () => void;
  onPickBanner: () => void;
}

/** Cover photo and profile photo, with upload, crop and pick buttons. */
export function PhotoSection({
  avatarUrl,
  bannerUrl,
  displayName,
  username,
  onUploadAvatar,
  onCropAvatar,
  onCartoonAvatar,
  onUploadBanner,
  onCropBanner,
  onPickBanner,
}: PhotoSectionProps) {
  return (
    <section
      className="overflow-hidden rounded-lg border border-border bg-surface"
      aria-labelledby="photos-title"
    >
      <h2 id="photos-title" className="sr-only">
        Photos
      </h2>
      <div className="relative h-32 bg-surface-muted sm:h-40">
        {bannerUrl && <img src={bannerUrl} alt="Your cover" className="h-full w-full object-cover" />}
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            type="button"
            variant="circleIcon"
            size="icon"
            className="shadow-sm"
            onClick={onPickBanner}
            aria-label="Pick a cover photo"
          >
            <ImageIcon aria-hidden="true" />
          </Button>
          {bannerUrl && (
            <Button
              type="button"
              variant="circleIcon"
              size="icon"
              className="shadow-sm"
              onClick={onCropBanner}
              aria-label="Crop cover photo"
            >
              <Crop aria-hidden="true" />
            </Button>
          )}
          <Button
            type="button"
            variant="circleIcon"
            size="icon"
            className="shadow-sm"
            onClick={onUploadBanner}
            aria-label="Upload a cover photo"
          >
            <Camera aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="-mt-10 flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
        <Avatar className="size-24 border-4 border-surface shadow-sm">
          <AvatarImage src={avatarUrl || getAvatarUrl(null, username || "user")} alt="Your profile photo" />
          <AvatarFallback className="bg-surface-muted font-display text-2xl font-bold text-fg">
            {initialOf(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onUploadAvatar}>
            <Camera aria-hidden="true" />
            Upload photo
          </Button>
          {avatarUrl && (
            <Button type="button" size="sm" variant="outline" onClick={onCropAvatar}>
              <Crop aria-hidden="true" />
              Crop
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={onCartoonAvatar}>
            <Smile aria-hidden="true" />
            Cartoon avatar
          </Button>
        </div>
      </div>
    </section>
  );
}
