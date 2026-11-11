"use client";

import { CameraOff, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSmartInterval, type SmartIntervalController } from "@/hooks/use-smart-interval";
import { CallEngine, type CallState } from "@/lib/calls/call-engine";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { initialOf } from "@/lib/utils";
import { CallControls } from "./call-controls";

interface ActiveCallOverlayProps {
  callId: string;
  isCaller: boolean;
  type: "audio" | "video";
  partner: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    username?: string;
  };
  remotePeerId?: string;
  onCallEnded: () => void;
}

const STATE_LABEL: Record<CallState, string> = {
  IDLE: "Starting…",
  CALLING: "Calling…",
  RINGING: "Ringing…",
  ACCEPTED: "Connecting…",
  CONNECTING: "Connecting…",
  CONNECTED: "",
  RECONNECTING: "Reconnecting…",
  ENDED: "Call ended",
  FAILED: "Call failed",
};

function formatSeconds(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Full-screen call in the night palette: remote video (or avatar), self view, timer, controls. */
export function ActiveCallOverlay({
  callId,
  isCaller,
  type,
  partner,
  remotePeerId,
  onCallEnded,
}: ActiveCallOverlayProps) {
  const [callState, setCallState] = useState<CallState>("CONNECTING");
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(type === "audio");
  const [duration, setDuration] = useState(0);
  const [safetyOpen, setSafetyOpen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const engineRef = useRef<CallEngine | null>(null);
  // The parent re-renders while it polls; keep the latest callback without restarting the call.
  const onEndedRef = useRef(onCallEnded);
  useEffect(() => {
    onEndedRef.current = onCallEnded;
  }, [onCallEnded]);

  useEffect(() => {
    if (callState !== "CONNECTED") return;
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    let poll: SmartIntervalController | null = null;
    let cancelled = false;
    const engine = new CallEngine({
      onStateChange: (state, err) => {
        setCallState(state);
        if (err) toast.error(err);
      },
      onLocalStream: (stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      },
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      },
      onClose: () => {
        sounds.pop();
        toast.info("Call ended");
        onEndedRef.current();
      },
    });
    engineRef.current = engine;
    const media = { video: type === "video", audio: true };

    async function start() {
      try {
        const myPeerId = await engine.initPeer();
        if (isCaller) {
          if (remotePeerId) {
            engine.callPeer(remotePeerId, media);
            return;
          }
          // Wait for the other person to answer: 2s backing off to 4s while it
          // rings, paused on hidden tabs (one check fires when visible again).
          if (cancelled) return;
          poll = createSmartInterval(
            async () => {
              try {
                const res = await fetch(`/api/calls/${callId}`);
                const data = (await res.json()) as { call?: { status?: string; receiverPeerId?: string } };
                if (data?.call?.status === "ACCEPTED" && data.call.receiverPeerId) {
                  poll?.stop();
                  engine.callPeer(data.call.receiverPeerId, media);
                  return true;
                }
                if (data?.call?.status === "DECLINED" || data?.call?.status === "ENDED") {
                  poll?.stop();
                  toast.info(`${partner.displayName} didn't pick up`);
                  onEndedRef.current();
                  return true;
                }
              } catch {
                // Keep waiting; the next poll retries.
              }
              return false;
            },
            { baseMs: 2000, maxMs: 4000 }
          );
          poll.start();
        } else {
          await fetch(`/api/calls/${callId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "ACCEPT", receiverPeerId: myPeerId }),
          });
          await engine.answerIncomingCall(media);
        }
      } catch {
        toast.error("Couldn't start the call. Allow microphone and camera access, then try again.");
      }
    }

    void start();
    return () => {
      cancelled = true;
      poll?.stop();
      engine.destroy();
    };
  }, [callId, isCaller, type, remotePeerId, partner.displayName]);

  function toggleMic() {
    if (!engineRef.current) return;
    setMicMuted(!engineRef.current.toggleMicrophone());
    sounds.tap();
    haptics.light();
  }

  function toggleCamera() {
    if (!engineRef.current) return;
    setCameraOff(!engineRef.current.toggleCamera());
    sounds.tap();
    haptics.light();
  }

  async function switchCamera() {
    if (!engineRef.current) return;
    sounds.tap();
    haptics.medium();
    await engineRef.current.switchCamera();
  }

  async function endCall() {
    sounds.pop();
    haptics.medium();
    try {
      await fetch(`/api/calls/${callId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "END" }),
      });
    } catch {
      // Ending locally is enough; the server times the call out.
    }
    engineRef.current?.destroy();
    onEndedRef.current();
  }

  const status = callState === "CONNECTED" ? formatSeconds(duration) : STATE_LABEL[callState];
  const initials = initialOf(partner.displayName);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${type === "video" ? "Video" : "Voice"} call with ${partner.displayName}`}
      className="dark fixed inset-0 z-(--z-modal) flex h-dvh w-full flex-col justify-between overflow-hidden bg-bg text-fg select-none"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {type === "video" ? (
          // biome-ignore lint/a11y/useMediaCaption: live WebRTC stream
          <video ref={remoteVideoRef} autoPlay playsInline className="size-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <Avatar className="size-32">
              <AvatarImage src={partner.avatarUrl || ""} alt="" />
              <AvatarFallback className="bg-brand-subtle text-4xl font-bold text-brand-text">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h2 className="max-w-full font-display text-3xl font-bold break-words">{partner.displayName}</h2>
            <p className="text-lg text-fg-muted tabular-nums" aria-live="polite">
              {status}
            </p>
          </div>
        )}

        {type === "video" && (
          <div className="absolute top-20 right-4 z-20 aspect-3/4 w-28 overflow-hidden rounded-lg border border-border bg-surface shadow-lg sm:top-6 sm:right-6 sm:w-36">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="size-full scale-x-[-1] object-cover"
            />
            {cameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface text-fg-muted">
                <CameraOff className="size-6" aria-label="Your camera is off" />
              </div>
            )}
          </div>
        )}
      </div>

      <header className="relative z-20 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {type === "video" ? (
          <div className="flex min-w-0 items-center gap-3 rounded-full bg-surface py-1.5 pr-4 pl-1.5 shadow-lg">
            <Avatar className="size-9">
              <AvatarImage src={partner.avatarUrl || ""} alt="" />
              <AvatarFallback className="bg-brand-subtle text-xs font-bold text-brand-text">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm leading-tight font-semibold">{partner.displayName}</p>
              <p className="text-xs text-fg-muted tabular-nums" aria-live="polite">
                {status}
              </p>
            </div>
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setSafetyOpen(true)}
          aria-label="Safety options"
          className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-surface text-fg shadow-lg transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ShieldAlert className="size-5" />
        </button>
      </header>

      <div className="relative z-20 flex justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <CallControls
          isVideo={type === "video"}
          micMuted={micMuted}
          cameraOff={cameraOff}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onSwitchCamera={() => void switchCamera()}
          onEnd={() => void endCall()}
        />
      </div>

      <Dialog open={safetyOpen} onOpenChange={setSafetyOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Feel unsafe?</DialogTitle>
            <DialogDescription>
              End the call now. Then tell us what happened so we can look into it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button variant="danger" onClick={() => void endCall()}>
              End call
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/safety">Report a problem</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
