"use client";

import { Mic, RotateCcw, Send, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadMediaFile } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioRecorded: (url: string, duration: number) => void;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function VoiceRecorderModal({ isOpen, onClose, onAudioRecorded }: VoiceRecorderModalProps) {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecording,
  } = useAudioRecorder();

  const [isUploading, setIsUploading] = useState(false);

  async function handleStart() {
    try {
      sounds.tap();
      haptics.medium();
      await startRecording();
    } catch {
      toast.error("Can't use your microphone. Allow mic access in your browser settings, then try again.");
    }
  }

  async function handleStop() {
    sounds.tap();
    haptics.success();
    await stopRecording();
  }

  function handleDiscard() {
    sounds.tap();
    haptics.light();
    cancelRecording();
  }

  function handleClose() {
    if (isUploading) return;
    cancelRecording();
    onClose();
  }

  async function handleConfirmAttach() {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      sounds.tap();
      haptics.medium();
      toast.loading("Saving voice note…", { id: "voice-upload" });

      const res = await uploadMediaFile(audioBlob, "audio", `voice_memo_${Date.now()}.webm`, (progress) => {
        if (progress.percent > 0 && progress.percent < 100) {
          toast.loading(`Saving voice note… ${progress.percent}%`, { id: "voice-upload" });
        }
      });
      toast.success("Voice note added", { id: "voice-upload" });
      onAudioRecorded(res.url, recordingTime || 1);
      clearRecording();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Couldn't save your voice note. Check your connection and try again.",
        { id: "voice-upload" }
      );
    } finally {
      setIsUploading(false);
    }
  }

  const hasRecording = Boolean(audioUrl) && !isRecording;
  const status = isRecording ? "Recording…" : hasRecording ? "Listen back, then send" : "Tap Record to start";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Voice note</DialogTitle>
          <DialogDescription>{status}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative flex size-28 items-center justify-center">
            {isRecording && (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-danger-subtle transition-ui"
                style={{ transform: `scale(${0.8 + (audioLevel / 100) * 0.35})` }}
              />
            )}
            <span
              className={cn(
                "relative flex size-20 items-center justify-center rounded-full transition-ui",
                isRecording
                  ? "bg-danger text-danger-fg"
                  : hasRecording
                    ? "bg-verified text-verified-fg"
                    : "bg-brand-subtle text-brand-text"
              )}
              aria-hidden
            >
              <Mic className="size-8" />
            </span>
          </div>

          <p className="font-display text-3xl font-bold tabular-nums text-fg">{formatTime(recordingTime)}</p>

          {hasRecording && audioUrl && (
            // biome-ignore lint/a11y/useMediaCaption: preview of the user's own voice recording
            <audio src={audioUrl} controls className="h-11 w-full" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isRecording && !hasRecording && (
            <Button className="w-full" onClick={handleStart}>
              <Mic aria-hidden />
              Record
            </Button>
          )}

          {isRecording && (
            <>
              <Button variant="secondary" size="icon" onClick={handleDiscard} aria-label="Delete recording">
                <Trash2 aria-hidden />
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleStop}>
                <Square className="fill-current" aria-hidden />
                Stop
              </Button>
            </>
          )}

          {hasRecording && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={clearRecording}
                disabled={isUploading}
                aria-label="Record again"
              >
                <RotateCcw aria-hidden />
              </Button>
              <Button className="flex-1" onClick={handleConfirmAttach} loading={isUploading}>
                <Send aria-hidden />
                Add voice note
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
