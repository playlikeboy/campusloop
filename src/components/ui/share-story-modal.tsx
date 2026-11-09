"use client";

import { Check, Copy, Download, MessageCircle, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { FeedPost } from "@/hooks/use-feed";
import { cleanSnippet } from "@/lib/utils";

interface ShareStoryModalProps {
  post: FeedPost;
  isOpen: boolean;
  onClose: () => void;
}

// Canvas colours come from the live semantic tokens so the exported story
// matches the app theme. `accent` is the text token that stays legible on `stops`.
const THEMES = [
  { id: "dark", name: "Campus Dark", stops: ["--fg", "--fg", "--fg-muted"], accent: "--bg" },
  { id: "purple", name: "Campus Vibe", stops: ["--brand", "--brand", "--brand-hover"], accent: "--brand-fg" },
  { id: "pink", name: "Confession Tea", stops: ["--crush", "--crush", "--crush-text"], accent: "--crush-fg" },
  { id: "cyan", name: "Cyber Campus", stops: ["--reward", "--reward", "--reward-text"], accent: "--reward-fg" },
];

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function ShareStoryModal({ post, isOpen, onClose }: ShareStoryModalProps) {
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const postUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/post/${post.id}`
      : `https://campusloop.space/post/${post.id}`;

  const authorHandle = post.isAnonymous ? post.pseudonym || "anonymous" : post.author?.username || "student";

  function handleShareWhatsApp() {
    let text = "";
    const cleanBody = cleanSnippet(post.body, 120);
    if (post.type === "CONFESSION") {
      text = `Anonymous Confession on CampusLoop:\n"${cleanBody}"\n\nRead full tea at: ${postUrl}`;
    } else if (post.type === "POLL") {
      text = `Campus Poll on CampusLoop:\n"${cleanBody}"\n\nCast your vote at: ${postUrl}`;
    } else {
      text = `Campus Discussion on CampusLoop:\n"${cleanBody}"\n\nJoin the discussion at: ${postUrl}`;
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    toast.success("Opening WhatsApp share!");
  }

  async function handleNativeShare() {
    if (!canvasRef.current || typeof window === "undefined" || !navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      // Try sharing canvas image file if navigator.canShare supports files
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `campusloop-story-${post.id}.png`, { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            try {
              await navigator.share({
                title: "CampusLoop Story",
                text: `Check out this campus story: ${postUrl}`,
                files: [file],
              });
              return;
            } catch {
              // Fallback to text share
            }
          }
        }

        // Fallback text share
        try {
          await navigator.share({
            title: "CampusLoop",
            text: `Check out this campus post on CampusLoop: "${cleanSnippet(post.body, 100)}"`,
            url: postUrl,
          });
        } catch {
          handleCopyLink();
        }
      }, "image/png");
    } catch {
      handleCopyLink();
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  // Draw 9:16 Story Card on HTML Canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 9:16 aspect ratio dimensions (1080 x 1920)
    canvas.width = 1080;
    canvas.height = 1920;

    // 1. Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    selectedTheme.stops.forEach((name, i) => {
      gradient.addColorStop(i / (selectedTheme.stops.length - 1), token(name));
    });
    const onTheme = token(selectedTheme.accent);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Draw Top Branding
    ctx.fillStyle = onTheme;
    ctx.font = "bold 52px sans-serif";
    ctx.fillText("CampusLoop", 120, 160);

    ctx.globalAlpha = 0.7;
    ctx.font = "34px sans-serif";
    ctx.fillText("VERIFIED STUDENT NETWORK", 120, 215);
    ctx.globalAlpha = 1;

    // 3. Draw Center Card Container
    const cardX = 90;
    const cardY = 340;
    const cardWidth = 900;
    const cardHeight = 1180;
    const radius = 48;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = token("--surface");
    ctx.strokeStyle = token("--border");
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, radius);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Draw Post Type Tag / Institution
    ctx.fillStyle = token("--brand-text");
    ctx.font = "bold 32px sans-serif";
    const postTypeBadge =
      post.type === "CONFESSION"
        ? "ANONYMOUS CONFESSION"
        : post.type === "POLL"
          ? "CAMPUS POLL"
          : "CAMPUS PULSE";
    ctx.fillText(postTypeBadge, 140, 420);

    ctx.fillStyle = token("--fg-muted");
    ctx.font = "28px sans-serif";
    ctx.fillText(post.institution?.name || "Verified Campus", 140, 465);

    // 5. Draw Author Handle
    ctx.fillStyle = token("--fg");
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(`@${authorHandle}`, 140, 560);

    // 6. Draw Post Body Text (Wrapped lines)
    ctx.fillStyle = token("--fg");
    ctx.font = "38px sans-serif";
    const words = post.body.split(" ");
    let line = "";
    let y = 650;
    const lineHeight = 56;
    const maxWidth = 800;

    for (let n = 0; n < words.length; n++) {
      const testLine = `${line + words[n]} `;
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, 140, y);
        line = `${words[n]} `;
        y += lineHeight;
        if (y > 1320) {
          ctx.fillText("...", 140, y);
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (y <= 1320) {
      ctx.fillText(line, 140, y);
    }

    // 7. Draw Footer Call to Action
    ctx.fillStyle = onTheme;
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("Join the tea on CampusLoop", 120, 1680);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "34px sans-serif";
    ctx.fillText("campusloop.space", 120, 1735);
  }, [isOpen, post, selectedTheme, authorHandle]);

  function handleDownloadStoryImage() {
    if (!canvasRef.current) return;
    const image = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `campusloop-story-${post.id}.png`;
    link.click();
    toast.success("Story card image downloaded! Upload it to Instagram Story");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-background p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Share2 className="h-4 w-4 text-primary" /> Share & Story Generator
          </h3>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Theme Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Select Story Aesthetic</label>
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={`py-1.5 px-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                  selectedTheme.id === theme.id
                    ? "border-brand bg-brand-subtle text-brand-text"
                    : "border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>

        {/* 9:16 Story Card Preview Canvas */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground">9:16 Instagram Story Card</p>
          <canvas
            ref={canvasRef}
            className="w-44 h-76 rounded-md shadow-lg object-contain"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 min-h-[44px] rounded-md bg-success text-success-fg text-xs font-semibold hover:bg-success/90 active:scale-95 transition-colors cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </button>

          <button
            onClick={handleNativeShare}
            className="py-2.5 min-h-[44px] rounded-md bg-brand text-brand-fg text-xs font-semibold hover:bg-brand-hover active:scale-95 transition-colors cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Share2 className="h-4 w-4" /> Share via Apps
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadStoryImage}
            className="py-2.5 min-h-[40px] rounded-md border border-border bg-surface text-fg text-xs font-semibold hover:bg-surface-muted active:scale-95 transition-colors cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Download className="h-4 w-4" /> Save Image
          </button>

          <button
            onClick={handleCopyLink}
            className="py-2.5 min-h-[40px] rounded-md border border-border bg-surface text-fg text-xs font-semibold hover:bg-surface-muted active:scale-95 transition-colors cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
