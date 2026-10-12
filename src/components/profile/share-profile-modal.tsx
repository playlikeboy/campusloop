"use client";

import { Check, Copy, Download, Share2, X } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LinkedinIcon, XIcon } from "@/components/ui/social-icons";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

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

export function ShareProfileModal({ isOpen, onClose, profile }: ShareProfileModalProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [activeUrlType, setActiveUrlType] = useState<"at" | "short">("at");

  const canonicalUrl = `https://campusloop.space/@${profile.username}`;
  const shortUrl = `https://campusloop.space/u/${profile.username}`;
  const activeUrl = activeUrlType === "at" ? canonicalUrl : shortUrl;

  const shareText = `Check out ${profile.displayName} (@${profile.username}) on CampusLoop — Verified Student Network 🎓`;

  // Generate QR Code data URL
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(canonicalUrl, {
      width: 720,
      margin: 2,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [isOpen, canonicalUrl]);

  const handleCopy = async (url: string, label: string) => {
    try {
      sounds.ting();
      haptics.light();
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName} on CampusLoop`,
          text: shareText,
          url: activeUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    await handleCopy(activeUrl, "Profile link");
  };

  const handleDownloadCard = async () => {
    if (!qrDataUrl) return;
    setIsGeneratingImage(true);

    try {
      sounds.tap();
      haptics.medium();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      const width = 800;
      const height = 1000;
      canvas.width = width;
      canvas.height = height;

      // Dark minimalist background
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      // Subtle gradient header
      const grad = ctx.createLinearGradient(0, 0, width, 300);
      grad.addColorStop(0, "rgba(59, 130, 246, 0.2)");
      grad.addColorStop(1, "rgba(9, 9, 11, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 300);

      // Brand Logo Header
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px system-ui, sans-serif";
      ctx.fillText("CampusLoop", 60, 80);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 16px system-ui, sans-serif";
      ctx.fillText("Verified Student Network", 60, 110);

      // White card container for QR
      const cardX = 60;
      const cardY = 160;
      const cardW = width - 120;
      const cardH = 680;

      ctx.fillStyle = "#18181b";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 32);
      ctx.fill();

      // Border for card
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Student info on card
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 34px system-ui, sans-serif";
      ctx.fillText(profile.displayName, cardX + 40, cardY + 70);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "600 20px system-ui, sans-serif";
      ctx.fillText(`@${profile.username}`, cardX + 40, cardY + 105);

      if (profile.institutionName) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "500 18px system-ui, sans-serif";
        const campus = profile.institutionName.split(",")[0] || profile.institutionName;
        ctx.fillText(campus, cardX + 40, cardY + 140);
      }

      // Draw QR Image
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });

      const qrSize = 360;
      const qrX = (width - qrSize) / 2;
      const qrY = cardY + 180;

      // QR white backdrop
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 24);
      ctx.fill();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // URL under QR
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`campusloop.space/@${profile.username}`, width / 2, cardY + qrSize + 250);
      ctx.textAlign = "start";

      // Footer
      ctx.fillStyle = "#52525b";
      ctx.font = "500 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Scan with your camera to view verified profile", width / 2, height - 60);

      // Trigger download
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `CampusLoop-${profile.username}.png`;
      a.click();
      toast.success("Student card downloaded! 📸");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate student card image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/60 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-3xl">
        <DialogTitle className="sr-only">Share @{profile.username}&apos;s Profile</DialogTitle>

        {/* Header Preview Banner */}
        <div className="relative p-6 pb-4 bg-linear-to-b from-primary/10 via-background/40 to-background border-b border-border/30">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 size-8 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-3.5">
            <Avatar className="size-14 rounded-full border-2 border-primary/20 shadow-md">
              <AvatarImage src={profile.avatarUrl || ""} className="object-cover" />
              <AvatarFallback className="font-black text-lg bg-muted text-foreground">
                {profile.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-foreground truncate">{profile.displayName}</h3>
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-xs font-semibold text-primary">Student</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
              {profile.institutionName && (
                <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
                  {profile.institutionName.split(",")[0]}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* URL Switcher Tabs & Copy Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>Profile Link</span>
              <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
                <button
                  type="button"
                  onClick={() => setActiveUrlType("at")}
                  className={cn(
                    "px-2 py-0.5 rounded-md transition-colors cursor-pointer text-[10px]",
                    activeUrlType === "at"
                      ? "bg-background text-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  /@{profile.username}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUrlType("short")}
                  className={cn(
                    "px-2 py-0.5 rounded-md transition-colors cursor-pointer text-[10px]",
                    activeUrlType === "short"
                      ? "bg-background text-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  /u/{profile.username}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl border border-border/70 bg-muted/20 hover:border-border transition-colors">
              <span className="text-xs font-mono text-foreground/90 truncate flex-1 select-all">
                {activeUrl.replace(/^https?:\/\//, "")}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(activeUrl, "Profile link")}
                className="h-8 px-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer active:scale-95"
              >
                {copiedLink === activeUrl ? (
                  <>
                    <Check className="size-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Quick Channels */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Share Directly</p>
            <div className="grid grid-cols-4 gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${shareText}\n\n${activeUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl border border-border/50 bg-secondary/50 hover:bg-secondary text-foreground hover:border-emerald-500/40 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.961.547 1.77.84 2.79.84h.001c3.181 0 5.768-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.828c0 5.514-4.486 10-10 10-1.742 0-3.376-.452-4.807-1.241l-5.193 1.359 1.385-5.062c-.889-1.488-1.385-3.228-1.385-5.056 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-foreground">WhatsApp</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  shareText
                )}&url=${encodeURIComponent(activeUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl border border-border/50 bg-secondary/50 hover:bg-secondary text-foreground hover:border-sky-500/40 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="size-8 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <XIcon className="size-3.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground">X / Twitter</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(activeUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl border border-border/50 bg-secondary/50 hover:bg-secondary text-foreground hover:border-blue-500/40 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="size-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LinkedinIcon className="size-4" />
                </div>
                <span className="text-[11px] font-bold text-foreground">LinkedIn</span>
              </a>

              <button
                type="button"
                onClick={handleNativeShare}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl border border-border/50 bg-secondary/50 hover:bg-secondary text-foreground hover:border-primary/40 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="size-4" />
                </div>
                <span className="text-[11px] font-bold text-foreground">More</span>
              </button>
            </div>
          </div>

          {/* QR Code & Student Card Download */}
          <div className="rounded-2xl border border-border/50 bg-secondary/30 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {qrDataUrl ? (
                <div className="size-14 rounded-xl bg-white p-1 shrink-0 shadow-sm border border-white/10 flex items-center justify-center">
                  <img src={qrDataUrl} alt="QR Code" className="size-full object-contain" />
                </div>
              ) : (
                <div className="size-14 rounded-xl bg-muted animate-pulse shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Student ID QR Card</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  High-res image for Instagram story or portfolio
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={isGeneratingImage || !qrDataUrl}
              className="h-8 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="size-3.5 text-primary" />
              <span>{isGeneratingImage ? "Saving..." : "Save Card"}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
