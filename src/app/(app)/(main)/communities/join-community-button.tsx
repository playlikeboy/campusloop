"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { notifyAuthRequired } from "@/components/auth/auth-required-overlay";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { joinCommunity } from "./actions";

interface JoinButtonProps {
  communityId: string;
  initialIsMember?: boolean;
  className?: string;
  onMembershipChange?: (isMember: boolean) => void;
}

export function JoinCommunityButton({
  communityId,
  initialIsMember = false,
  className,
  onMembershipChange,
}: JoinButtonProps) {
  const [isMember, setIsMember] = useState(initialIsMember);
  const [isPending, setIsPending] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  async function handleToggle(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isPending) return;

    setIsPending(true);
    haptics.light();

    try {
      const res = await joinCommunity(communityId);
      setIsMember(res.joined);
      onMembershipChange?.(res.joined);
      if (res.joined) sounds.tap();
      toast.success(res.joined ? "Joined community" : "Left community");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update membership";
      if (/not authenticated|unauthorized|login|required/i.test(message)) {
        notifyAuthRequired("join");
      } else {
        toast.error(message);
      }
    } finally {
      setIsPending(false);
    }
  }

  const label = isMember ? (isHovering ? "Leave" : "Joined") : "Join";

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isPending}
      aria-pressed={isMember}
      className={cn(
        "h-8 px-4 text-xs font-bold rounded-full transition-all cursor-pointer disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-1.5 active:scale-95",
        isMember
          ? "border border-border/60 bg-transparent text-foreground hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5"
          : "bg-foreground text-background hover:opacity-90 shadow-2xs",
        className
      )}
    >
      {isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : isMember ? (
        <Check className="size-3" />
      ) : (
        <Plus className="size-3" />
      )}
      <span>{label}</span>
    </button>
  );
}
