"use client";

import { Camera, Crop, Eye, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AvatarOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasPhoto: boolean;
  onView: () => void;
  onCrop: () => void;
  onUpload: () => void;
  onCartoon: () => void;
}

/** Choices shown when you tap your own profile photo. */
export function AvatarOptionsDialog({
  open,
  onOpenChange,
  hasPhoto,
  onView,
  onCrop,
  onUpload,
  onCartoon,
}: AvatarOptionsDialogProps) {
  const run = (fn: () => void) => () => {
    onOpenChange(false);
    fn();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Profile photo</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button onClick={run(onUpload)}>
            <Camera aria-hidden="true" />
            Upload a photo
          </Button>
          {hasPhoto && (
            <>
              <Button variant="outline" onClick={run(onCrop)}>
                <Crop aria-hidden="true" />
                Crop photo
              </Button>
              <Button variant="outline" onClick={run(onView)}>
                <Eye aria-hidden="true" />
                View photo
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={run(onCartoon)}>
            <Smile aria-hidden="true" />
            Use a cartoon avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Full-size photo viewer. Tap outside or press Escape to close. */
export function PhotoLightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(url)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-surface p-2 sm:p-3">
        {url && <img src={url} alt="" className="max-h-[80vh] w-full rounded-lg object-contain" />}
      </DialogContent>
    </Dialog>
  );
}
