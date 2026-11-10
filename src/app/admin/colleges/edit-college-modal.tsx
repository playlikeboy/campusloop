"use client";

import { Globe, Image as ImageIcon, Loader2, Save, School, Trophy, Upload, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input";
import { fetchCollegeWikipediaSummary } from "@/lib/college-enricher";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { useEscapeKey } from "../_components/use-escape-key";
import { updateCollegeDetails } from "./actions";

export interface CollegeEditData {
  id: string;
  name: string;
  slug: string;
  state?: string | null;
  district?: string | null;
  website?: string | null;
  yearOfEstablishment?: number | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  nirfRank?: number | null;
  description?: string | null;
  extraData?: Record<string, unknown> | null;
}

interface EditCollegeModalProps {
  college: CollegeEditData | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditCollegeModal({ college, onClose, onSaved }: EditCollegeModalProps) {
  useEscapeKey(true, onClose);
  const [name, setName] = useState(college?.name || "");
  const [logoUrl, setLogoUrl] = useState(college?.logoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(college?.bannerUrl || "");
  const [website, setWebsite] = useState(college?.website || "");
  const [nirfRank, setNirfRank] = useState<string>(college?.nirfRank ? String(college.nirfRank) : "");
  const [yearOfEstablishment, setYearOfEstablishment] = useState<string>(
    college?.yearOfEstablishment ? String(college.yearOfEstablishment) : ""
  );
  const [state, setState] = useState(college?.state || "");
  const [district, setDistrict] = useState(college?.district || "");
  const [description, setDescription] = useState(college?.description || "");

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const logoFileRef = useRef<HTMLInputElement | null>(null);
  const bannerFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (college) {
      setName(college.name);
      setLogoUrl(college.logoUrl || "");
      setBannerUrl(college.bannerUrl || "");
      setWebsite(college.website || "");
      setNirfRank(college.nirfRank ? String(college.nirfRank) : "");
      setYearOfEstablishment(college.yearOfEstablishment ? String(college.yearOfEstablishment) : "");
      setState(college.state || "");
      setDistrict(college.district || "");
      setDescription(college.description || "");
    }
  }, [college]);

  if (!college) return null;

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      toast.loading("Uploading logo", { id: "upload-logo" });
      const res = await uploadImageToImgBB(file);
      setLogoUrl(res.displayUrl || res.url);
      toast.success("Logo uploaded", { id: "upload-logo" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logo upload failed", {
        id: "upload-logo",
      });
    } finally {
      setIsUploadingLogo(false);
      if (logoFileRef.current) logoFileRef.current.value = "";
    }
  }

  async function handleUploadBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      toast.loading("Uploading banner", { id: "upload-banner" });
      const res = await uploadImageToImgBB(file);
      setBannerUrl(res.displayUrl || res.url);
      toast.success("Banner uploaded", { id: "upload-banner" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Banner upload failed", {
        id: "upload-banner",
      });
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileRef.current) bannerFileRef.current.value = "";
    }
  }

  async function handleAutoEnrich() {
    setIsEnriching(true);
    try {
      toast.loading("Searching Wikipedia", {
        id: "enrich",
      });
      const data = await fetchCollegeWikipediaSummary(name);
      if (!data) {
        toast.error("No Wikipedia page found for this college. Write the summary by hand.", {
          id: "enrich",
        });
        return;
      }

      if (data.extract) setDescription(data.extract);
      if (data.thumbnailUrl && !logoUrl) setLogoUrl(data.thumbnailUrl);
      if (data.originalImageUrl && !bannerUrl) setBannerUrl(data.originalImageUrl);

      toast.success("Filled in from Wikipedia. Check it before saving.", { id: "enrich" });
    } catch {
      toast.error("Couldn't reach Wikipedia. Try again or write it by hand.", { id: "enrich" });
    } finally {
      setIsEnriching(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!college || !name.trim()) return;

    setIsSaving(true);
    try {
      await updateCollegeDetails(college.id, {
        name,
        logoUrl: logoUrl.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
        website: website.trim() || null,
        nirfRank: nirfRank ? parseInt(nirfRank, 10) : null,
        yearOfEstablishment: yearOfEstablishment ? parseInt(yearOfEstablishment, 10) : null,
        state: state.trim() || null,
        district: district.trim() || null,
        description: description.trim() || null,
      });

      toast.success(`${name} saved`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update college");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay">
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90dvh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-xl border border-border bg-surface-raised p-6 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <School className="size-5 text-brand-text" />
            <h3 className="text-base font-bold text-fg">Edit college</h3>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <X aria-hidden />
          </Button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={logoFileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleUploadLogo}
        />
        <input
          ref={bannerFileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleUploadBanner}
        />

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          {/* Live Media Previews & Uploads */}
          <div className="space-y-3 p-4 rounded-lg border border-border bg-surface-muted">
            <span className="text-xs font-bold text-fg-muted flex items-center gap-1.5">
              <ImageIcon className="size-3.5 text-brand-text" /> Campus Banner &amp; Official Logo
            </span>

            {/* Live Banner Preview Card */}
            <div className="relative h-32 w-full rounded-lg overflow-hidden border border-border bg-surface-muted flex items-center justify-center group">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-fg-muted">
                  No banner yet. Upload one or paste a link below.
                </span>
              )}

              {/* Logo Overlay Preview */}
              <div className="absolute bottom-2 left-3 size-14 rounded-xl bg-surface border-2 border-border shadow-lg p-1 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                ) : (
                  <School className="size-6 text-brand-text" />
                )}
              </div>
            </div>

            {/* Upload Buttons Row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isUploadingLogo}
                onClick={() => logoFileRef.current?.click()}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {isUploadingLogo ? (
                  <Loader2 className="size-3.5 animate-spin text-brand-text" />
                ) : (
                  <Upload className="size-3.5 text-brand-text" />
                )}
                <span>Upload logo</span>
              </button>

              <button
                type="button"
                disabled={isUploadingBanner}
                onClick={() => bannerFileRef.current?.click()}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {isUploadingBanner ? (
                  <Loader2 className="size-3.5 animate-spin text-brand-text" />
                ) : (
                  <Upload className="size-3.5 text-warning" />
                )}
                <span>Upload banner</span>
              </button>
            </div>

            {/* URL Input Fields */}
            <div className="space-y-2 pt-2">
              <div>
                <label
                  htmlFor="edit-college-logo-url-direct-image-li"
                  className="text-xs font-bold text-fg-muted"
                >
                  Logo link
                </label>
                <input
                  id="edit-college-logo-url-direct-image-li"
                  type="url"
                  placeholder="https://upload.wikimedia.org/.../logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-college-banner-image-url-direct-"
                  className="text-xs font-bold text-fg-muted"
                >
                  Banner link
                </label>
                <input
                  id="edit-college-banner-image-url-direct-"
                  type="url"
                  placeholder="https://bitmesra.ac.in/.../campus_banner.jpg"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>
            </div>
          </div>

          {/* College Information Fields */}
          <div className="space-y-3">
            <div>
              <label htmlFor="edit-college-college-official-name" className="text-xs font-bold text-fg-muted">
                Official name *
              </label>
              <input
                id="edit-college-college-official-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(fieldClassName, "w-full h-11")}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="edit-college-state" className="text-xs font-bold text-fg-muted">
                  State
                </label>
                <input
                  id="edit-college-state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>
              <div>
                <label htmlFor="edit-college-district" className="text-xs font-bold text-fg-muted">
                  District
                </label>
                <input
                  id="edit-college-district"
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>
              <div>
                <label htmlFor="edit-college-est-year" className="text-xs font-bold text-fg-muted">
                  Est. Year
                </label>
                <input
                  id="edit-college-est-year"
                  type="number"
                  placeholder="1955"
                  value={yearOfEstablishment}
                  onChange={(e) => setYearOfEstablishment(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-college-nirf-rank"
                  className="text-xs font-bold text-fg-muted flex items-center gap-1 text-warning"
                >
                  <Trophy className="size-3" /> NIRF Rank
                </label>
                <input
                  id="edit-college-nirf-rank"
                  type="number"
                  placeholder="53"
                  value={nirfRank}
                  onChange={(e) => setNirfRank(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-college-official-website"
                className="text-xs font-bold text-fg-muted flex items-center gap-1"
              >
                <Globe className="size-3" /> Official Website
              </label>
              <input
                id="edit-college-official-website"
                type="text"
                placeholder="https://bitmesra.ac.in"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={cn(fieldClassName, "w-full h-11")}
              />
            </div>

            {/* Description & Auto-Enrich */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-fg-muted">About the college</label>
                <button
                  type="button"
                  disabled={isEnriching}
                  onClick={handleAutoEnrich}
                  className="text-xs font-bold text-brand-text hover:underline cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {isEnriching ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" />}
                  <span>Fill from Wikipedia</span>
                </button>
              </div>
              <textarea
                aria-label="College description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short summary students will see on the college page"
                className={cn(fieldClassName, "w-full resize-none py-2.5")}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-fg-muted hover:text-fg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
