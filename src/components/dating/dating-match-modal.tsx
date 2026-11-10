"use client";

import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sticker } from "@/components/ui/stickers";
import { initials } from "./crush-types";

interface MatchResult {
  matched: boolean;
  conversationId?: string;
  matchedUser?: {
    displayName: string;
    avatarUrl: string | null;
  };
}

interface DatingMatchModalProps {
  matchResult: MatchResult | null;
  onClose: () => void;
}

/** The match moment: the one popping sticker in Campus Match. */
export function DatingMatchModal({ matchResult, onClose }: DatingMatchModalProps) {
  const open = !!matchResult?.matched && !!matchResult.matchedUser;
  const user = matchResult?.matchedUser;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {user && (
        <DialogContent className="max-w-sm text-center">
          <Sticker
            tone="crush"
            pop
            tilt="left"
            className="mx-auto mt-2 mb-5 flex w-fit items-center gap-3 py-3 pr-5 pl-3 [--pop-from:-12deg]"
          >
            <Avatar className="size-16 border-2 border-crush-fg">
              <AvatarImage src={user.avatarUrl || undefined} alt="" />
              <AvatarFallback className="bg-crush-subtle text-lg font-semibold text-crush-text">
                {initials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="sticker-caption flex items-center gap-1.5 text-3xl">
              <Heart className="size-6 fill-current" aria-hidden="true" />
              Match
            </span>
          </Sticker>

          <DialogTitle className="pr-0">It's a match!</DialogTitle>
          <DialogDescription className="mt-1">
            You and {user.displayName} liked each other. Say hi.
          </DialogDescription>

          <div className="mt-6 flex flex-col gap-2">
            {matchResult?.conversationId && (
              <Button variant="crush" asChild>
                <Link href={`/chat/${matchResult.conversationId}`}>
                  <MessageCircle />
                  Send a message
                </Link>
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Keep swiping
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
