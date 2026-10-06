"use client";

import * as React from "react";
import { SecretCrushButton } from "./secret-crush-button";

export default function SecretCrushButtonDemo() {
  return (
    <div className="flex min-h-[420px] w-full flex-col items-center justify-center bg-background py-8 px-4">
      <div className="text-center max-w-sm mb-6 space-y-1">
        <h3 className="text-lg font-black text-foreground">Interactive Secret Crush</h3>
        <p className="text-xs text-muted-foreground">
          Tap the sealed button to trigger romantic audio arpeggios and floating heart particles.
        </p>
      </div>

      <SecretCrushButton />
    </div>
  );
}
