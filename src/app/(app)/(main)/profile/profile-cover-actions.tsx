"use client";

import { ArrowLeft, Camera, ImageIcon, Move, QrCode, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ProfileCoverActionsProps {
  isOwnProfile: boolean;
  hasBanner: boolean;
  onShare: () => void;
  onQr: () => void;
  onPickCover: () => void;
  onUploadCover: () => void;
  onRepositionCover: () => void;
}

/** Round icon buttons on the cover photo: back on the left, share and cover tools on the right. */
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
        <Button variant="circleIcon" size="icon" className={icon} onClick={onQr} aria-label="Show QR code">
          <QrCode aria-hidden="true" />
        </Button>
        <Button
          variant="circleIcon"
          size="icon"
          className={icon}
          onClick={onShare}
          aria-label="Share profile"
        >
          <Share2 aria-hidden="true" />
        </Button>
        {isOwnProfile && (
          <>
            <Button
              variant="circleIcon"
              size="icon"
              className={`${icon} hidden sm:inline-flex`}
              onClick={onPickCover}
              aria-label="Pick a cover photo"
            >
              <ImageIcon aria-hidden="true" />
            </Button>
            {hasBanner && (
              <Button
                variant="circleIcon"
                size="icon"
                className={icon}
                onClick={onRepositionCover}
                aria-label="Move cover photo"
              >
                <Move aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="circleIcon"
              size="icon"
              className={icon}
              onClick={onUploadCover}
              aria-label="Upload a cover photo"
            >
              <Camera aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </>
  );
}
