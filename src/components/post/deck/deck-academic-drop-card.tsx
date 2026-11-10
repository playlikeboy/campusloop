"use client";

import { BookOpen, ChevronDown, Download, ExternalLink, GraduationCap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { checkAndRecordDownload } from "@/lib/academic-download-limiter";
import type { DeckAcademicResource } from "./deck-types";

interface DeckAcademicDropCardProps {
  resource: DeckAcademicResource;
}

export function DeckAcademicDropCard({ resource }: DeckAcademicDropCardProps) {
  const previewUrl = resource.slug ? `/academics/study-material/${resource.slug}` : `/academics`;

  function handleDownload() {
    const downloadCheck = checkAndRecordDownload(false);
    if (!downloadCheck.allowed) {
      toast.info("Sign in to keep downloading", {
        action: {
          label: "Sign In",
          onClick: () => {
            window.location.href = `/sign-in?returnTo=${encodeURIComponent(previewUrl)}`;
          },
        },
      });
      return;
    }

    const url = resource.fileUrl || resource.driveUrl;
    if (!url) {
      toast.error("The file isn't ready yet. Try again in a moment.");
      return;
    }
    window.open(url, "_blank");
    toast.success("Opening…");
  }

  return (
    <div className="relative w-full h-full max-w-xl mx-auto flex flex-col justify-center px-4 py-4 sm:px-6 select-none overflow-hidden">
      <div className="rounded-xl bg-surface p-5 sm:p-6 border border-border space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-md bg-surface-muted text-fg-muted flex items-center justify-center">
              <GraduationCap className="size-4" />
            </div>
            <div>
              <h3 className="text-base">Study material</h3>
              <p className="text-xs text-muted-foreground">
                {resource.institutionName || "Shared by students"}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-muted text-fg-muted">
            {resource.resourceType || "Notes"}
          </span>
        </div>

        {/* Resource Hero Container */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-muted text-fg tabular-nums">
              {resource.subjectCode}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {resource.branch} · Sem {resource.semester}
            </span>
          </div>

          <h4 className="font-bold text-base text-foreground leading-snug">
            {resource.title || resource.subjectName}
          </h4>

          <p className="text-xs text-muted-foreground line-clamp-2">
            Subject: <strong className="text-foreground">{resource.subjectName}</strong>
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Download className="size-3.5" aria-hidden /> {resource.downloadsCount || 0} downloads
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 pt-1">
          <Link href={previewUrl} className={buttonVariants({ className: "flex-1" })}>
            <BookOpen className="size-3.5" />
            <span>Open</span>
          </Link>

          <button type="button" onClick={handleDownload} className={buttonVariants({ variant: "secondary" })}>
            <ExternalLink className="size-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <div className="pt-4 text-center text-sm text-fg-muted flex items-center justify-center gap-1">
        <span>Swipe for more</span>
        <ChevronDown className="size-4" aria-hidden />
      </div>
    </div>
  );
}
