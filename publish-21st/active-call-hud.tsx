"use client";

import * as React from "react";
import {
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";

export interface ActiveCallHudProps {
  peerName?: string;
  peerAvatar?: string;
  initialCallDuration?: number;
  onEndCall?: () => void;
  className?: string;
}

export function ActiveCallHud({
  peerName = "Sneha Reddy",
  peerAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2310b981'/><stop offset='100%' stop-color='%23059669'/></linearGradient></defs><rect width='200' height='200' rx='100' fill='url(%23g)'/><circle cx='100' cy='80' r='36' fill='white' fill-opacity='0.9'/><path d='M50 160 C50 120 150 120 150 160 Z' fill='white' fill-opacity='0.9'/></svg>",
  initialCallDuration = 84,
  onEndCall,
  className = "",
}: ActiveCallHudProps) {
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOn, setIsVideoOn] = React.useState(true);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [duration, setDuration] = React.useState(initialCallDuration);

  // Timer tick
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Minimized Floating Pill State
  if (isMinimized) {
    return (
      <div
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-border/80 bg-card/90 px-4 py-2.5 shadow-2xl backdrop-blur-xl transition-all select-none ${className}`}
      >
        <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="font-bold text-xs text-foreground">{peerName}</span>
        <span className="font-mono text-xs text-muted-foreground">{formatDuration(duration)}</span>

        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label="Expand call"
        >
          <Maximize2 className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={onEndCall}
          className="rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 cursor-pointer shadow-xs"
          aria-label="End call"
        >
          <PhoneOff className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full max-w-sm rounded-3xl border border-border/80 bg-card/95 p-5 shadow-2xl backdrop-blur-2xl transition-all select-none ${className}`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
            Encrypted Call
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="rounded-xl p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Minimize Call"
        >
          <Minimize2 className="size-4" />
        </button>
      </div>

      {/* Main Avatar & Frequency Visualizer */}
      <div className="flex flex-col items-center py-4 space-y-3">
        <div className="relative">
          <img
            src={peerAvatar}
            alt={peerName}
            className="size-20 rounded-full object-cover border-2 border-primary/30 shadow-lg"
          />

          {/* Sound Wave Ripple */}
          <span className="absolute -inset-1 rounded-full border border-primary/30 animate-ping pointer-events-none" />
        </div>

        <div className="text-center">
          <h3 className="text-base font-black text-foreground">{peerName}</h3>
          <p className="font-mono text-xs font-semibold text-muted-foreground mt-0.5">
            {formatDuration(duration)}
          </p>
        </div>

        {/* Dynamic Voice Activity Equalizer Bars */}
        <div className="flex items-center gap-1 h-6 py-1">
          {[12, 20, 16, 24, 18, 14, 22, 10].map((h, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-primary/70 transition-all duration-300"
              style={{
                height: `${isMuted ? 4 : h}px`,
                opacity: isMuted ? 0.3 : 0.8,
              }}
            />
          ))}
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="mt-4 flex items-center justify-center gap-3 pt-4 border-t border-border/40">
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          className={`flex size-11 items-center justify-center rounded-2xl border transition-all cursor-pointer ${
            isMuted
              ? "border-red-500/40 bg-red-500/10 text-red-500"
              : "border-border/70 bg-muted/40 hover:bg-muted text-foreground"
          }`}
          aria-label={isMuted ? "Unmute mic" : "Mute mic"}
        >
          {isMuted ? <MicOff className="size-4.5" /> : <Mic className="size-4.5" />}
        </button>

        <button
          type="button"
          onClick={() => setIsVideoOn((prev) => !prev)}
          className={`flex size-11 items-center justify-center rounded-2xl border transition-all cursor-pointer ${
            !isVideoOn
              ? "border-red-500/40 bg-red-500/10 text-red-500"
              : "border-border/70 bg-muted/40 hover:bg-muted text-foreground"
          }`}
          aria-label={isVideoOn ? "Turn off video" : "Turn on video"}
        >
          {!isVideoOn ? <VideoOff className="size-4.5" /> : <Video className="size-4.5" />}
        </button>

        <button
          type="button"
          onClick={onEndCall}
          className="flex size-11 items-center justify-center rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30 active:scale-95 transition-all cursor-pointer"
          aria-label="End Call"
        >
          <PhoneOff className="size-5" />
        </button>
      </div>
    </div>
  );
}

export default ActiveCallHud;
