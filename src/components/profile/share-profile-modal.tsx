"use client";

import { Check, Copy, Download, MessageCircle, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { drawQrPoster } from "@/components/common/qr-poster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { LinkedinIcon, XIcon } from "@/components/ui/social-icons";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    institutionName?: string | null;
    branch?: string | null;
    course?: string | null;
    points?: number | null;
  };
}

// QR modules are drawn in fixed ink on white so every phone camera can read them.
const QR_COLORS = { dark: "#15131D", light: "#FFFFFF" }; // ds-allow: QR image, fixed ink on white

export function ShareProfileModal({ isOpen, onClose, profile }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const url = `https://campusloop.space/@${profile.username}`;
  const displayUrl = url.replace(/^https?:\/\//, "");
  const shareText = `${profile.displayName} (@${profile.username}) is on CampusLoop`;
  const college = profile.institutionName?.split(",")[0];

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(url, { width: 720, margin: 2, color: QR_COLORS, errorCorrectionLevel: "H" })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [isOpen, url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      sounds.ting();
      haptics.light();
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Press and hold the link to copy it.");
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile.displayName} on CampusLoop`, text: shareText, url });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    await copyLink();
  }

  async function saveImage() {
    if (!qrDataUrl) return;
    setIsSaving(true);
    try {
      haptics.medium();
      const blob = await drawQrPoster({
        qrDataUrl,
        title: profile.displayName,
        subtitle: [`@${profile.username}`, college].filter(Boolean).join(" · "),
        badgeText: "Scan to see my profile",
        displayUrl,
      });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `campusloop-${profile.username}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      toast.success("Image saved");
    } catch {
      toast.error("Couldn't make the image. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const channel =
    "flex flex-col items-center gap-1.5 rounded-md py-2 text-xs font-medium text-fg outline-none transition-ui hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring";
  const channelIcon = "flex size-11 items-center justify-center rounded-full bg-surface-muted";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={profile.avatarUrl || ""} alt="" className="object-cover" />
              <AvatarFallback className="bg-surface-muted font-semibold">
                {profile.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold text-fg">{profile.displayName}</p>
              <p className="truncate text-sm text-fg-muted">
                @{profile.username}
                {college ? ` · ${college}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-surface-muted p-1.5 pl-3">
            <span className="min-w-0 flex-1 truncate text-sm text-fg select-all">{displayUrl}</span>
            <Button size="sm" onClick={copyLink}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-1">
            <a
              className={channel}
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${url}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={channelIcon}>
                <MessageCircle aria-hidden="true" className="size-5" />
              </span>
              WhatsApp
            </a>
            <a
              className={channel}
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={channelIcon}>
                <XIcon className="size-4" />
              </span>
              X
            </a>
            <a
              className={channel}
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={channelIcon}>
                <LinkedinIcon className="size-4" />
              </span>
              LinkedIn
            </a>
            <button type="button" className={`${channel} cursor-pointer`} onClick={nativeShare}>
              <span className={channelIcon}>
                <Share2 aria-hidden="true" className="size-5" />
              </span>
              More
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-md border border-border p-3">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${displayUrl}`}
                className="size-16 shrink-0 rounded-sm"
              />
            ) : (
              <Skeleton className="size-16 shrink-0 rounded-sm" />
            )}
            <p className="min-w-0 flex-1 text-sm text-fg-muted">Save a QR image for your Story or bio.</p>
            <Button variant="outline" size="sm" onClick={saveImage} loading={isSaving} disabled={!qrDataUrl}>
              <Download aria-hidden="true" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
