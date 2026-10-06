"use client";

import * as React from "react";
import { ConfettiCannon } from "./confetti-cannon";

export default function ConfettiCannonDemo() {
  return (
    <div className="flex min-h-[440px] w-full flex-col items-center justify-center bg-background py-8 px-4">
      <div className="text-center max-w-sm mb-8 space-y-1">
        <h3 className="text-lg font-black text-foreground">Canvas Confetti Cannon</h3>
        <p className="text-xs text-muted-foreground">
          Zero-dependency particle physics engine with gravity, velocity, rotation, and custom color palettes.
        </p>
      </div>

      <ConfettiCannon />
    </div>
  );
}
