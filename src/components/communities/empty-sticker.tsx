import type * as React from "react";
import { Sticker } from "@/components/ui/stickers";

/** The one sticker on an empty state: an icon on a white sticker tile. Pass as EmptyState `illustration`. */
export function EmptySticker({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Sticker pop className="flex size-14 items-center justify-center" aria-hidden="true">
      <Icon className="size-6 text-brand-text" />
    </Sticker>
  );
}
