"use client";

import { Ban, EyeOff, Flag, LogOut, PhoneOff, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioOption } from "@/components/ui/radio-group";

export const REPORT_REASONS = [
  { value: "HARASSMENT", label: "Harassment or insults" },
  { value: "SEXUAL", label: "Sexual or inappropriate content" },
  { value: "THREAT", label: "Threats" },
  { value: "PII_ASK", label: "Asking for my number or socials" },
  { value: "SPAM", label: "Spam or scam" },
  { value: "OTHER", label: "Something else" },
];

export function SafetyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const points = [
    { icon: EyeOff, text: "Your name and photo stay hidden unless you both choose to show them." },
    { icon: PhoneOff, text: "Phone numbers, emails and social handles get blocked in chat." },
    { icon: LogOut, text: "You can leave, block or report at any time." },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>How Random keeps you safe</DialogTitle>
        </DialogHeader>
        <ul className="space-y-3 text-sm text-fg">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-fg-muted" aria-hidden />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <Button className="mt-5 w-full" onClick={() => onOpenChange(false)}>
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

interface OptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReport: () => void;
  onBlock: () => void;
  blocking: boolean;
}

/** Report or block the person you're chatting with. The description says what blocking does before they tap it. */
export function ChatOptionsDialog({ open, onOpenChange, onReport, onBlock, blocking }: OptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Something wrong?</DialogTitle>
          <DialogDescription>Blocking means you won't be matched with them again.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Button variant="secondary" className="w-full justify-start" onClick={onReport}>
            <Flag aria-hidden />
            Report
          </Button>
          <Button variant="danger" className="w-full justify-start" onClick={onBlock} loading={blocking}>
            <Ban aria-hidden />
            Block and find someone new
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function ReportDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onSubmit,
  submitting,
}: ReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Report this chat</DialogTitle>
          <DialogDescription>
            You'll leave the chat right away. Our team reviews every report.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={reason}
          onValueChange={(v) => onReasonChange(String(v))}
          aria-label="Reason"
          className="space-y-3"
        >
          {REPORT_REASONS.map((r) => (
            <RadioOption key={r.value} value={r.value}>
              {r.label}
            </RadioOption>
          ))}
        </RadioGroup>
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onSubmit} loading={submitting}>
            Send report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface VideoConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerName: string;
  onAccept: () => void;
}

export function VideoConsentDialog({ open, onOpenChange, partnerName, onAccept }: VideoConsentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Switch to video?</DialogTitle>
          <DialogDescription>
            {partnerName} wants to video call. Your camera turns on only if you say yes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button className="flex-1" onClick={onAccept}>
            <Video aria-hidden />
            Start video
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
