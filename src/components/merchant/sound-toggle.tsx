"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sounds } from "@/lib/sounds";
import { playNewOrderChime } from "./orders/order-chime";

/** Turns the new-order sound on or off. Turning it on plays the chime once so the merchant knows it works. */
export function SoundToggle({ enabled, onChange }: { enabled: boolean; onChange: (next: boolean) => void }) {
  return (
    <Button
      variant="outline"
      aria-pressed={enabled}
      onClick={() => {
        sounds.tap();
        if (!enabled) playNewOrderChime();
        onChange(!enabled);
      }}
    >
      {enabled ? <Volume2 /> : <VolumeX />}
      {enabled ? "Sound on" : "Sound off"}
    </Button>
  );
}
