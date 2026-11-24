"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { notifyAuthRequired } from "@/components/auth/auth-required-overlay";
import { Button } from "@/components/ui/button";
import { trackCommunityJoin } from "@/lib/analytics/ga4";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { joinCommunity } from "./actions";

interface JoinButtonProps {
  communityId: string;
  initialIsMember?: boolean;
  className?: string;
  /** `row` is the compact list-row action; a joined row reads as quiet state, not a call to action. */
  size?: "sm" | "row";
  onMembershipChange?: (isMember: boolean) => void;
}

export function JoinCommunityButton({
  communityId,
  initialIsMember = false,
  className,
  size = "sm",
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
      if (res.joined) trackCommunityJoin(communityId);
      toast.success(res.joined ? "You joined" : "You left");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't update your membership. Try again.";
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
    <Button
      type="button"
      size={size}
      variant={isMember ? (isHovering ? "danger" : size === "row" ? "ghost" : "outline") : "primary"}
      onClick={handleToggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={() => setIsHovering(true)}
      onBlur={() => setIsHovering(false)}
      loading={isPending}
      aria-pressed={isMember}
      aria-label={isMember ? "Leave community" : "Join community"}
      className={cn("shrink-0", size === "row" && isMember && !isHovering && "text-fg-muted", className)}
    >
      {!isPending && (isMember ? <Check /> : <Plus className={cn(size === "row" && "max-sm:hidden")} />)}
      {label}
    </Button>
  );
}
