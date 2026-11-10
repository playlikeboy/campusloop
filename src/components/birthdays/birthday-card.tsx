"use client";

import confetti from "canvas-confetti";
import { Cake, MessageCircle, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface BirthdayStudent {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  course?: string | null;
  branch?: string | null;
  gender?: string | null;
  dob?: string | null;
  daysUntil?: number;
  birthMonth?: number;
  birthDay?: number;
  institution?: { id: string; name: string } | null;
}

interface BirthdayCardProps {
  student: BirthdayStudent;
  isToday?: boolean;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function birthDate(s: BirthdayStudent): string {
  if (s.birthMonth && s.birthDay) return `${MONTH_NAMES[s.birthMonth - 1]} ${s.birthDay}`;
  if (!s.dob) return "";
  const [, m, d] = s.dob.split("-");
  const month = MONTH_NAMES[Number.parseInt(m, 10) - 1];
  return month ? `${month} ${Number.parseInt(d, 10)}` : "";
}

/** One person in the birthdays list. Today's people get a Wish button. */
export function BirthdayCard({ student, isToday = false }: BirthdayCardProps) {
  const [wished, setWished] = useState(false);
  const date = birthDate(student);
  const college = student.institution?.name.split(",")[0];

  function wish(e: React.MouseEvent<HTMLButtonElement>) {
    sounds.tap();
    haptics.success();
    const rect = e.currentTarget.getBoundingClientRect();
    confetti({
      particleCount: 60,
      spread: 75,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      // ds-allow: canvas-confetti takes hex only; celebratory burst, not UI chrome
      colors: ["#6b3df5", "#ffd43b", "#ff5c93", "#3ddc97"],
    });
    if (!wished) {
      setWished(true);
      toast.success(`You wished @${student.username} happy birthday`);
    }
  }

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border p-3",
        isToday ? "bg-surface-raised" : "bg-surface"
      )}
    >
      <Link
        href={`/@${student.username}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="relative shrink-0">
          <Avatar className="size-11">
            <AvatarImage src={student.avatarUrl || ""} alt="" />
            <AvatarFallback className="bg-surface-muted text-sm font-semibold">
              {(student.displayName?.[0] || "S").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isToday && (
            <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-bg bg-surface-muted text-fg">
              <Cake aria-hidden="true" className="size-3" />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-fg">{student.displayName}</span>
          <span className="block truncate text-xs text-fg-muted">
            @{student.username}
            {student.course && ` · ${student.course}`}
          </span>
          {college && <span className="block truncate text-xs text-fg-subtle">{college}</span>}
        </span>
      </Link>

      {isToday ? (
        <Button size="sm" variant={wished ? "outline" : "primary"} onClick={wish}>
          <PartyPopper aria-hidden="true" />
          {wished ? "Wished" : "Wish"}
        </Button>
      ) : (
        <span className="shrink-0 text-right">
          {date && <span className="block text-sm font-semibold text-fg">{date}</span>}
          {student.daysUntil !== undefined && (
            <span className="block text-xs text-fg-muted">
              {student.daysUntil === 1 ? "Tomorrow" : `In ${student.daysUntil} days`}
            </span>
          )}
        </span>
      )}

      <Button asChild variant="ghost" size="icon" className="shrink-0">
        <Link href={`/chat?recipientId=${student.id}`} aria-label={`Message ${student.displayName}`}>
          <MessageCircle aria-hidden="true" />
        </Link>
      </Button>
    </li>
  );
}
