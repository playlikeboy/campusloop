"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { UnsplashImagePicker } from "@/components/common/unsplash-image-picker";
import { SocialLinksEditor } from "@/components/profile/social-links-editor";
import { Button } from "@/components/ui/button";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { isUsernameBlocking } from "@/components/ui/username-status";
import { useUsernameAvailability } from "@/hooks/use-username-availability";
import { validateDisplayName, validateUsername } from "@/lib/validation";
import { AboutSection } from "./about-section";
import { GallerySection } from "./gallery-section";
import { PhotoSection } from "./photo-section";
import { useEditProfileForm } from "./use-edit-profile-form";

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";
type CropMode = "avatar" | "banner";

export function EditProfileClient() {
  const {
    values,
    set,
    addGalleryPhoto,
    error,
    galleryInputRef,
    isLoading,
    isSaving,
    isUploadingPhoto,
    removeGalleryPhoto,
    save,
  } = useEditProfileForm();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [crop, setCrop] = useState<{ url: string; mode: CropMode } | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  const nameCheck = values.displayName ? validateDisplayName(values.displayName) : null;
  const userCheck = values.username ? validateUsername(values.username) : null;
  const usernameStatus = useUsernameAvailability(values.username);

  function readFile(e: React.ChangeEvent<HTMLInputElement>, mode: CropMode) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && setCrop({ url: reader.result, mode });
    reader.onerror = () => toast.error("Couldn't read that image. Try a JPG or PNG.");
    reader.readAsDataURL(file);
  }

  function cropCurrent(mode: CropMode) {
    const url = mode === "avatar" ? values.avatarUrl : values.bannerUrl;
    if (url) setCrop({ url, mode });
    else (mode === "avatar" ? avatarInputRef : bannerInputRef).current?.click();
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 pt-4" aria-busy="true">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-11 rounded-md" />
        <Skeleton className="h-11 rounded-md" />
      </div>
    );
  }

  const blocked =
    isSaving ||
    isUploadingPhoto ||
    Boolean(nameCheck && !nameCheck.isValid) ||
    Boolean(userCheck && !userCheck.isValid) ||
    isUsernameBlocking(usernameStatus);

  return (
    <div className="mx-auto max-w-xl px-4 pt-2 pb-28">
      <input
        ref={avatarInputRef}
        type="file"
        accept={IMAGE_TYPES}
        className="hidden"
        onChange={(e) => readFile(e, "avatar")}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept={IMAGE_TYPES}
        className="hidden"
        onChange={(e) => readFile(e, "banner")}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={IMAGE_TYPES}
        className="hidden"
        onChange={addGalleryPhoto}
      />

      <header className="mb-4 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back to profile">
          <Link href="/profile">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-2xl text-fg">Edit profile</h1>
      </header>

      <form onSubmit={save} className="space-y-8" noValidate>
        <PhotoSection
          avatarUrl={values.avatarUrl}
          bannerUrl={values.bannerUrl}
          displayName={values.displayName}
          username={values.username}
          onUploadAvatar={() => avatarInputRef.current?.click()}
          onCropAvatar={() => cropCurrent("avatar")}
          onCartoonAvatar={() =>
            set(
              "avatarUrl",
              `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(values.username.trim() || values.displayName.trim() || "student")}`
            )
          }
          onUploadBanner={() => bannerInputRef.current?.click()}
          onCropBanner={() => cropCurrent("banner")}
          onPickBanner={() => setCoverPickerOpen(true)}
        />

        <AboutSection
          values={values}
          set={set}
          nameError={nameCheck && !nameCheck.isValid ? nameCheck.error : undefined}
          usernameStatus={usernameStatus}
        />

        <div className="border-t border-border pt-6">
          <GallerySection
            photos={values.photos}
            isUploading={isUploadingPhoto}
            onAdd={() => galleryInputRef.current?.click()}
            onRemove={removeGalleryPhoto}
          />
        </div>

        <div className="border-t border-border pt-6">
          <SocialLinksEditor value={values.socialLinks} onChange={(v) => set("socialLinks", v)} />
        </div>

        <div className="sticky bottom-20 z-10 space-y-2 rounded-lg border border-border bg-surface p-3 shadow-sm md:bottom-4">
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={isSaving} disabled={blocked}>
            Save profile
          </Button>
        </div>
      </form>

      {crop && (
        <ImageCropModal
          isOpen
          onClose={() => setCrop(null)}
          imageUrl={crop.url}
          mode={crop.mode}
          onCropComplete={(url) => set(crop.mode === "avatar" ? "avatarUrl" : "bannerUrl", url)}
        />
      )}
      <UnsplashImagePicker
        isOpen={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={(photo) => set("bannerUrl", photo.url)}
        defaultQuery="campus"
        title="Pick a cover photo"
      />
    </div>
  );
}
