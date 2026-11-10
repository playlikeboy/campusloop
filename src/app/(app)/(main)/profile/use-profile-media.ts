"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

type CropMode = "avatar" | "banner";

async function patchProfile(body: Record<string, string>) {
  const res = await fetch("/api/profile/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Profile update failed");
}

/** Cover and profile photo uploads with crop, optimistic preview and rollback. */
export function useProfileMedia(initial: { avatarUrl?: string | null; bannerUrl?: string | null }) {
  const router = useRouter();
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [crop, setCrop] = useState<{ url: string; mode: CropMode } | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  function readFile(e: React.ChangeEvent<HTMLInputElement>, mode: CropMode) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setCrop({ url: reader.result, mode });
    };
    reader.onerror = () => toast.error("Couldn't read that image. Try a JPG or PNG.");
    reader.readAsDataURL(file);
  }

  async function save(mode: CropMode, url: string) {
    const setter = mode === "banner" ? setBannerUrl : setAvatarUrl;
    const previous = mode === "banner" ? bannerUrl : avatarUrl;
    setter(url);
    try {
      await patchProfile(mode === "banner" ? { bannerUrl: url } : { avatarUrl: url });
      toast.success(mode === "banner" ? "Cover photo updated" : "Profile photo updated");
      router.refresh();
    } catch {
      setter(previous);
      toast.error(
        mode === "banner"
          ? "Couldn't save your cover photo. Try again."
          : "Couldn't save your profile photo. Try again."
      );
    }
  }

  return {
    bannerInputRef,
    avatarInputRef,
    crop,
    closeCrop: () => setCrop(null),
    openCrop: (url: string, mode: CropMode) => setCrop({ url, mode }),
    onBannerFile: (e: React.ChangeEvent<HTMLInputElement>) => readFile(e, "banner"),
    onAvatarFile: (e: React.ChangeEvent<HTMLInputElement>) => readFile(e, "avatar"),
    onCropDone: (url: string) => (crop ? save(crop.mode, url) : undefined),
    setBannerFromUrl: (url: string) => save("banner", url),
    currentBannerUrl: bannerUrl ?? initial.bannerUrl ?? null,
    currentAvatarUrl: avatarUrl ?? initial.avatarUrl ?? null,
  };
}
