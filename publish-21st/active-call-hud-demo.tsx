"use client";

import * as React from "react";
import { ActiveCallHud } from "./active-call-hud";

export default function ActiveCallHudDemo() {
  return (
    <div className="flex min-h-[500px] w-full items-center justify-center bg-background py-8 px-4">
      <ActiveCallHud
        peerName="Sneha Reddy"
        onEndCall={() => alert("Call ended")}
      />
    </div>
  );
}
