"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import type { SocialLinks } from "@/lib/social-links";
import { uploadImageToImgBB } from "@/lib/upload";
import { validateDisplayName, validateUsername } from "@/lib/validation";
import { MAX_GALLERY_PHOTOS } from "./gallery-section";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface EditProfileValues {
  displayName: string;
  username: string;
  headline: string;
  gender: Gender;
  dob: string;
  isDobPrivate: boolean;
  course: string;
  branch: string;
  year: number;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  anonUsername: string;
  photos: string[];
  interests: string[];
  socialLinks: SocialLinks;
}

const EMPTY: EditProfileValues = {
  displayName: "",
  username: "",
  headline: "",
  gender: "MALE",
  dob: "",
  isDobPrivate: false,
  course: "",
  branch: "",
  year: 1,
  bio: "",
  avatarUrl: "",
  bannerUrl: "",
  anonUsername: "",
  photos: [],
  interests: [],
  socialLinks: { platforms: {}, custom: [] },
};

/** State, uploads and save for the edit profile form. */
export function useEditProfileForm() {
  const router = useRouter();
  const { profile, isLoading, mutate } = useProfile();
  const [values, setValues] = useState<EditProfileValues>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!profile) return;
    const stored = profile.socialLinks;
    setValues({
      displayName: profile.displayName || "",
      username: profile.username || "",
      headline: profile.headline || "",
      gender: (profile.gender as Gender) || "MALE",
      dob: profile.dob || "",
      isDobPrivate: Boolean(profile.isDobPrivate),
      course: profile.course || "",
      branch: profile.branch || "",
      year: profile.year || 1,
      bio: profile.bio || "",
      avatarUrl: profile.avatarUrl || "",
      bannerUrl: profile.bannerUrl || "",
      anonUsername: profile.anonymousUsername || "",
      photos: profile.photos || [],
      interests: profile.interests || [],
      socialLinks: { platforms: { ...(stored?.platforms ?? {}) }, custom: [...(stored?.custom ?? [])] },
    });
  }, [profile]);

  function set<K extends keyof EditProfileValues>(key: K, value: EditProfileValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function addGalleryPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (values.photos.length >= MAX_GALLERY_PHOTOS) {
      toast.error(`You can add up to ${MAX_GALLERY_PHOTOS} photos. Remove one first.`);
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setValues((prev) => ({ ...prev, photos: [...prev.photos, localUrl] }));
    setIsUploadingPhoto(true);
    try {
      const res = await uploadImageToImgBB(file);
      const url = res.displayUrl || res.url;
      setValues((prev) => ({ ...prev, photos: prev.photos.map((u) => (u === localUrl ? url : u)) }));
    } catch (err) {
      setValues((prev) => ({ ...prev, photos: prev.photos.filter((u) => u !== localUrl) }));
      toast.error(err instanceof Error ? err.message : "Couldn't upload the photo. Try a smaller image.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nameCheck = validateDisplayName(values.displayName);
    if (!nameCheck.isValid) return setError(nameCheck.error || "Add your name.");
    const userCheck = validateUsername(values.username);
    if (!userCheck.isValid) return setError(userCheck.error || "Pick a valid username.");

    setIsSaving(true);
    try {
      const v = values;
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: v.displayName.trim(),
          username: v.username.trim().toLowerCase(),
          headline: v.headline.trim(),
          gender: v.gender,
          dob: v.dob || null,
          isDobPrivate: v.isDobPrivate,
          course: v.course.trim(),
          branch: v.branch.trim(),
          year: v.year,
          bio: v.bio.trim(),
          avatarUrl: v.avatarUrl,
          bannerUrl: v.bannerUrl,
          photos: v.photos,
          interests: v.interests,
          socialLinks: v.socialLinks,
          anonymousUsername: v.anonUsername ? v.anonUsername.trim().toLowerCase().replace(/^@/, "") : null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Couldn't save your profile. Try again.");
      toast.success("Profile saved");
      await mutate();
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    values,
    set,
    isLoading,
    isSaving,
    isUploadingPhoto,
    error,
    galleryInputRef,
    addGalleryPhoto,
    removeGalleryPhoto: (i: number) =>
      setValues((prev) => ({ ...prev, photos: prev.photos.filter((_, j) => j !== i) })),
    save,
  };
}
