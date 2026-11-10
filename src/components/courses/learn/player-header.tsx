"use client";

import { Award, ChevronLeft, Keyboard, PanelRightClose, PanelRightOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "../progress-bar";

interface Props {
  slug: string;
  title: string;
  done: number;
  total: number;
  sidebar: boolean;
  certBusy: boolean;
  onCertificate: () => void;
  onToggleKeys: () => void;
  onToggleSidebar: () => void;
}

/** Player top bar: back to the course, title, progress, certificate and layout toggles. */
export function PlayerHeader({
  slug,
  title,
  done,
  total,
  sidebar,
  certBusy,
  onCertificate,
  onToggleKeys,
  onToggleSidebar,
}: Props) {
  const progress = total ? Math.round((done / total) * 100) : 0;
  return (
    <header className="relative flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-2 sm:gap-3 sm:px-4">
      <Button asChild variant="ghost" size="icon">
        <Link href={`/courses/${slug}`} aria-label="Back to the course page">
          <ChevronLeft className="size-5" />
        </Link>
      </Button>
      <h1 className="min-w-0 flex-1 truncate font-sans text-sm font-semibold text-fg sm:text-base">
        {title}
      </h1>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-fg-muted">
        {done}/{total}
        <span className="hidden sm:inline"> done</span>
      </span>
      {progress === 100 && (
        <Button onClick={onCertificate} loading={certBusy} aria-label="Get your certificate">
          {!certBusy && <Award aria-hidden />}
          <span className="hidden sm:inline">Get certificate</span>
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleKeys}
        aria-label="Keyboard shortcuts"
        className="hidden text-fg-muted lg:inline-flex"
      >
        <Keyboard />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label={sidebar ? "Hide course content" : "Show course content"}
        aria-pressed={sidebar}
        className="hidden text-fg-muted lg:inline-flex"
      >
        {sidebar ? <PanelRightClose /> : <PanelRightOpen />}
      </Button>
      <ProgressBar
        value={progress}
        done={done}
        total={total}
        label="Course progress"
        className="absolute inset-x-2 bottom-1 sm:inset-x-4"
      />
    </header>
  );
}
