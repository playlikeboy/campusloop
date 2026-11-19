"use client";

import { Check, Copy, MessageCircle, QrCode, Share2, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { BrandedQrModal } from "@/components/common/branded-qr-modal";
import { Button } from "@/components/ui/button";
import { LP_ACTION_REWARDS } from "@/constants/gamification";
import { useProfile } from "@/hooks/use-profile";
import { trackShare } from "@/lib/analytics/ga4";
import { inviteUrl } from "@/lib/referrals/invite";
import { cn } from "@/lib/utils";

const REWARD = LP_ACTION_REWARDS.REFERRAL_SIGNUP;

/** The signed-in student's personal invite link, with one-tap ways to send it. */
export function InviteCard({ className }: { className?: string }) {
  const { profile } = useProfile();
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  if (!profile?.username) return null;

  const link = inviteUrl(profile.username);
  const invites = profile.referralCount ?? 0;
  const message = `Join me on CampusLoop, the app only for students of our college. ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied");
      trackShare("copy_link", "invite", profile?.username);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Press and hold the link to copy it.");
    }
  }

  async function share() {
    if (typeof navigator.share !== "function") return copy();
    try {
      await navigator.share({ title: "CampusLoop", text: message, url: link });
      trackShare("native", "invite", profile?.username);
    } catch {
      // The student closed the share sheet.
    }
  }

  return (
    <section
      className={cn("space-y-3 rounded-lg border border-border bg-surface p-4", className)}
      aria-labelledby="invite-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 id="invite-title" className="text-lg text-fg">
            Invite your friends
          </h2>
          <p className="text-sm text-fg-muted">
            You get <span className="font-semibold text-reward-text">+{REWARD} LP</span> for every friend who
            joins with their college email.
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block text-2xl font-bold tabular-nums text-fg">{invites}</span>
          <span className="text-xs text-fg-muted">{invites === 1 ? "friend joined" : "friends joined"}</span>
        </p>
      </div>

      <button
        type="button"
        onClick={copy}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-md border border-border",
          "bg-surface-muted px-3 py-2.5 text-left"
        )}
        aria-label="Copy your invite link"
      >
        <span className="min-w-0 truncate text-sm font-medium text-fg">{link.replace("https://", "")}</span>
        {copied ? (
          <Check className="size-4 shrink-0 text-success" aria-hidden />
        ) : (
          <Copy className="size-4 shrink-0 text-fg-muted" aria-hidden />
        )}
      </button>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button asChild variant="success" size="sm">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare("whatsapp", "invite", profile.username)}
          >
            <MessageCircle aria-hidden /> WhatsApp
          </a>
        </Button>
        <Button variant="secondary" size="sm" onClick={share}>
          <Share2 aria-hidden /> Share
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setQrOpen(true)}>
          <QrCode aria-hidden /> QR code
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/invites">
            <Trophy aria-hidden /> Top inviters
          </Link>
        </Button>
      </div>

      <BrandedQrModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        title={`Join ${profile.displayName} on CampusLoop`}
        subtitle={profile.institution?.name ?? "Your campus. Only your campus."}
        shortUrl={link}
        category="profile"
        avatarUrl={profile.avatarUrl}
      />
    </section>
  );
}
