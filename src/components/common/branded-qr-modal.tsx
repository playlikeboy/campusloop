"use client";

import { Check, Copy, Download, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { drawQrPoster } from "./qr-poster";

export interface BrandedQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badgeText?: string;
  shortUrl: string;
  category?: "event" | "profile" | "article" | "community" | "store" | "general";
  avatarUrl?: string | null;
}

export function BrandedQrModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badgeText = "Verified students only",
  shortUrl,
  avatarUrl,
}: BrandedQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !shortUrl) return;
    QRCode.toDataURL(shortUrl, {
      width: 720,
      margin: 2,
      // ds-allow: QR modules must stay ink on white in both themes so phones can scan them
      color: { dark: "#15131D", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("QR code error:", err));
  }, [isOpen, shortUrl]);

  const displayUrl = useMemo(() => shortUrl.replace(/^https?:\/\//, ""), [shortUrl]);

  const handleCopyLink = async () => {
    try {
      sounds.ting();
      haptics.light();
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link. Press and hold it to copy instead.");
    }
  };

  const handleSaveImage = async () => {
    if (!qrDataUrl) return;
    setSaving(true);
    try {
      sounds.tap();
      haptics.medium();
      const blob = await drawQrPoster({ qrDataUrl, title, subtitle, badgeText, displayUrl });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 24);
      a.download = `campusloop-${slug}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("QR image saved");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save the image. Try again, or share the link instead.");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: `${title} on CampusLoop`, url: shortUrl });
        return;
      } catch {
        // Share sheet closed or unavailable: fall back to copying.
      }
    }
    handleCopyLink();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share with a QR code</DialogTitle>
          <DialogDescription>Anyone can scan it with their phone camera.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface-muted p-4 text-center">
          {avatarUrl && <img src={avatarUrl} alt="" className="size-14 rounded-full object-cover" />}
          <div className="w-full min-w-0">
            <p className="truncate font-semibold text-fg">{title}</p>
            {subtitle && <p className="truncate text-sm text-fg-muted">{subtitle}</p>}
          </div>

          <div className="sticker -rotate-2 p-3">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR code for ${title}`} className="size-44 object-contain" />
            ) : (
              <div
                className="skeleton-shimmer size-44 rounded-sm"
                role="status"
                aria-label="Making QR code"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex min-h-11 w-full items-center justify-between gap-2 rounded-full bg-surface px-4 text-left transition-ui hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="truncate text-sm font-medium text-fg">{displayUrl}</span>
            <span className="shrink-0 text-fg-muted">
              {copied ? (
                <Check className="size-4 text-verified-text" aria-label="Copied" />
              ) : (
                <Copy className="size-4" aria-label="Copy link" />
              )}
            </span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={handleSaveImage} disabled={!qrDataUrl} loading={saving}>
            <Download className="size-4" aria-hidden="true" />
            Save image
          </Button>
          <Button variant="secondary" onClick={handleShare}>
            <Share2 className="size-4" aria-hidden="true" />
            Share link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
