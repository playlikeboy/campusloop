"use client";

import { ArrowLeft, Camera, ImageIcon, MoreHorizontal, Move, QrCode, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ProfileCoverActionsProps {
  isOwnProfile: boolean;
  hasBanner: boolean;
  onShare: () => void;
  onQr: () => void;
  onPickCover: () => void;
  onUploadCover: () => void;
  onRepositionCover: () => void;
}

/**
 * Cover buttons: back on the left, share plus a "more" menu on the right.
 * QR code and cover tools live in the menu so the cover stays clear on phones.
 */
export function ProfileCoverActions({
  isOwnProfile,
  hasBanner,
  onShare,
  onQr,
  onPickCover,
  onUploadCover,
  onRepositionCover,
}: ProfileCoverActionsProps) {
  const router = useRouter();
  const icon = "shadow-sm";

  return (
    <>
      <Button
        variant="circleIcon"
        size="icon"
        className={icon}
        onClick={() => router.back()}
        aria-label="Go back"
      >
        <ArrowLeft aria-hidden="true" />
      </Button>
      <div className="flex items-center gap-2">
        <Button
          variant="circleIcon"
          size="icon"
          className={icon}
          onClick={onShare}
          aria-label="Share profile"
        >
          <Share2 aria-hidden="true" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More profile options"
            className={cn(buttonVariants({ variant: "circleIcon", size: "icon" }), icon)}
          >
            <MoreHorizontal aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onQr}>
              <QrCode aria-hidden="true" />
              Show QR code
            </DropdownMenuItem>
            {isOwnProfile && (
              <>
                <DropdownMenuItem onClick={onUploadCover}>
                  <Camera aria-hidden="true" />
                  Upload cover photo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPickCover}>
                  <ImageIcon aria-hidden="true" />
                  Pick a cover photo
                </DropdownMenuItem>
                {hasBanner && (
                  <DropdownMenuItem onClick={onRepositionCover}>
                    <Move aria-hidden="true" />
                    Move cover photo
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
