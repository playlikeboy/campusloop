"use client";

import { Camera, CameraOff, Mic, MicOff, PhoneOff, SwitchCamera } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUND =
  "flex size-14 cursor-pointer items-center justify-center rounded-full transition-ui outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-95";

interface CallControlsProps {
  isVideo: boolean;
  micMuted: boolean;
  cameraOff: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
  onEnd: () => void;
}

/** Bottom control bar: mute, camera, flip camera, end. */
export function CallControls({
  isVideo,
  micMuted,
  cameraOff,
  onToggleMic,
  onToggleCamera,
  onSwitchCamera,
  onEnd,
}: CallControlsProps) {
  const toggleClass = (on: boolean) =>
    cn(ROUND, on ? "bg-fg text-bg" : "bg-surface-muted text-fg hover:bg-surface-sunken");

  return (
    <div
      className="flex items-center gap-4 rounded-full bg-surface p-3 shadow-lg"
      role="toolbar"
      aria-label="Call controls"
    >
      <button
        type="button"
        onClick={onToggleMic}
        aria-pressed={micMuted}
        aria-label={micMuted ? "Unmute" : "Mute"}
        className={toggleClass(micMuted)}
      >
        {micMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
      </button>
      {isVideo && (
        <>
          <button
            type="button"
            onClick={onToggleCamera}
            aria-pressed={cameraOff}
            aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
            className={toggleClass(cameraOff)}
          >
            {cameraOff ? <CameraOff className="size-6" /> : <Camera className="size-6" />}
          </button>
          <button
            type="button"
            onClick={onSwitchCamera}
            aria-label="Flip camera"
            className={toggleClass(false)}
          >
            <SwitchCamera className="size-6" />
          </button>
        </>
      )}
      <button
        type="button"
        onClick={onEnd}
        aria-label="End call"
        className={cn(ROUND, "size-16 bg-danger text-danger-fg hover:bg-danger/90")}
      >
        <PhoneOff className="size-7" />
      </button>
    </div>
  );
}
