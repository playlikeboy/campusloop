"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerifiedSticker } from "@/components/ui/stickers";
import { sounds } from "@/lib/sounds";

interface CampusUnlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface JourneyStats {
  savedPostsCount: number;
  collegeName: string;
}

export function CampusUnlockedModal({ isOpen, onClose, onSuccess }: CampusUnlockedModalProps) {
  const router = useRouter();
  const [collegeEmail, setCollegeEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [journeyStats, setJourneyStats] = useState<JourneyStats | null>(null);
  const [stage, setStage] = useState<"email" | "verify">("email");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  /** Step 1: ask the provider to email a verification link. Grants nothing. */
  async function handleRequestVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!collegeEmail.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/upgrade-campus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeEmail }),
      });

      const data = (await res.json()) as {
        error?: string;
        pending?: boolean;
        alreadyVerified?: boolean;
        email?: string;
      };
      if (!res.ok) throw new Error(data.error || "Couldn't send the link. Check the email and try again.");

      setPendingEmail(data.email || collegeEmail.trim().toLowerCase());

      // A previous attempt may already be verified; finish immediately.
      if (data.alreadyVerified) {
        await handleConfirm(data.email || collegeEmail);
        return;
      }

      setStage("verify");
      toast.success("Verification link sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /** Step 2: apply the upgrade, but only once the provider says it is verified. */
  async function handleConfirm(emailOverride?: string) {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/upgrade-campus/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeEmail: emailOverride || pendingEmail || collegeEmail }),
      });

      const data = (await res.json()) as {
        error?: string;
        pendingVerification?: boolean;
        journeyStats?: JourneyStats;
      };

      if (!res.ok) {
        if (data.pendingVerification) {
          setError("Not verified yet. Open the link in your inbox, then try again.");
          return;
        }
        throw new Error(data.error || "Couldn't verify your email. Try again.");
      }

      sounds.pop();
      if (data.journeyStats) setJourneyStats(data.journeyStats);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEnterCampus() {
    onClose();
    router.refresh();
    window.location.href = "/feeds";
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {journeyStats ? (
          <div className="space-y-5 text-center">
            <VerifiedSticker
              label="Verified student"
              college={journeyStats.collegeName}
              className="sticker-pop"
            />
            <DialogHeader className="items-center text-center">
              <DialogTitle>You're in</DialogTitle>
              <DialogDescription>
                You can now post, chat and use Campus Match.
                {journeyStats.savedPostsCount > 0
                  ? ` Your ${journeyStats.savedPostsCount} saved ${journeyStats.savedPostsCount === 1 ? "post is" : "posts are"} still here.`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleEnterCampus} className="w-full">
              Go to my feed
            </Button>
          </div>
        ) : stage === "verify" ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Check your inbox</DialogTitle>
              <DialogDescription>
                We sent a link to <strong className="text-fg">{pendingEmail}</strong>. Open it, then come back
                and tap the button below.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button onClick={() => handleConfirm()} loading={isSubmitting}>
                I opened the link
              </Button>
              <Button
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => {
                  setStage("email");
                  setError(null);
                }}
              >
                Use a different email
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRequestVerification} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Verify your college email</DialogTitle>
              <DialogDescription>
                Get the verified badge and Campus Match. Your profile, points and saved posts stay the same.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="college-email">College email</Label>
              <Input
                id="college-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={collegeEmail}
                onChange={(e) => setCollegeEmail(e.target.value)}
                placeholder="you@college.ac.in"
                aria-invalid={error ? true : undefined}
              />
              {error && (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button type="submit" loading={isSubmitting} disabled={isSubmitting || !collegeEmail.trim()}>
                Send verification link
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Not now
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
