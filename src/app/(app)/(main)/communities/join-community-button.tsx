"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { notifyAuthRequired } from "@/components/auth/auth-required-overlay";
import { Button } from "@/components/ui/button";
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
      size="sm"
      variant={isMember ? (isHovering ? "danger" : "outline") : "primary"}
      onClick={handleToggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={() => setIsHovering(true)}
      onBlur={() => setIsHovering(false)}
      loading={isPending}
      aria-pressed={isMember}
      aria-label={isMember ? "Leave community" : "Join community"}
      className={cn("shrink-0", className)}
    >
      {!isPending && (isMember ? <Check /> : <Plus />)}
      {label}
    </Button>
  );
}
