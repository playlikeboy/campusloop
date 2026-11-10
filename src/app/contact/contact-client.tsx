"use client";

import { Check, Copy, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";

interface SupportDesk {
  id: string;
  name: string;
  email: string;
  forWhat: string;
  reply: string;
}

const DESKS: SupportDesk[] = [
  {
    id: "general",
    name: "Help with the app",
    email: "support@campusloop.space",
    forWhat: "Login problems, college email verification, bugs and feedback.",
    reply: "Reply within 24 hours",
  },
  {
    id: "safety",
    name: "Safety",
    email: "safety@campusloop.space",
    forWhat: "Ragging, harassment, doxxing or anything that makes you feel unsafe.",
    reply: "Reply within 12 hours",
  },
  {
    id: "privacy",
    name: "Your data",
    email: "privacy@campusloop.space",
    forWhat: "See, correct or delete your data under India's DPDP Act, 2023.",
    reply: "Reply within 48 hours",
  },
  {
    id: "partnerships",
    name: "Colleges and clubs",
    email: "partners@campusloop.space",
    forWhat: "Adding a college, club partnerships and Campus Ambassador applications.",
    reply: "Reply within 24 hours",
  },
  {
    id: "press",
    name: "Press",
    email: "press@campusloop.space",
    forWhat: "Interviews, stories and brand assets.",
    reply: "Reply within 48 hours",
  },
];

/** Support desks as rows: who to write to, what for, and how fast we reply. */
export function ContactDesks() {
  const [copiedDesk, setCopiedDesk] = useState<string | null>(null);

  const copyEmail = async (deskId: string, email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      haptics.light();
      setCopiedDesk(deskId);
      setTimeout(() => setCopiedDesk(null), 2000);
    } catch {
      toast.error("Couldn't copy the address. Press and hold it to copy instead.");
    }
  };

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {DESKS.map((desk) => {
        const isCopied = copiedDesk === desk.id;
        return (
          <li
            key={desk.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          >
            <div className="min-w-0">
              <h3 className="font-sans text-base font-semibold text-fg">{desk.name}</h3>
              <p className="mt-0.5 text-sm text-fg-muted">{desk.forWhat}</p>
              <p className="mt-1.5 break-all text-sm font-medium text-fg select-all">{desk.email}</p>
              <p className="text-sm text-fg-subtle">{desk.reply}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyEmail(desk.id, desk.email)}
                aria-label={isCopied ? `Copied ${desk.email}` : `Copy ${desk.email}`}
              >
                {isCopied ? (
                  <Check className="text-verified-text" aria-hidden="true" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
              </Button>
              <a href={`mailto:${desk.email}`} className={buttonVariants({ variant: "primary" })}>
                <Mail aria-hidden="true" />
                Email
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
