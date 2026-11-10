"use client";

import { Download, ExternalLink, FileArchive, FileCode, FileSpreadsheet, FileText } from "lucide-react";
import { formatFileSize } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  url: string;
  name?: string;
  size?: number;
  compact?: boolean;
  /** Inside the sender's violet chat bubble: draws in the bubble's foreground colour. */
  isMe?: boolean;
  className?: string;
}

const SHEET = ["xls", "xlsx", "csv"];
const ZIP = ["zip", "rar", "7z", "tar", "gz"];
const CODE = ["py", "cpp", "c", "java", "js", "ts", "html", "css", "sql"];

function DocIcon({ extension, className }: { extension: string; className?: string }) {
  if (SHEET.includes(extension)) return <FileSpreadsheet className={className} />;
  if (ZIP.includes(extension)) return <FileArchive className={className} />;
  if (CODE.includes(extension)) return <FileCode className={className} />;
  return <FileText className={className} />;
}

export function DocumentCard({
  url,
  name = "Document",
  size,
  compact = false,
  isMe = false,
  className,
}: DocumentCardProps) {
  const extension = name.includes(".") ? name.split(".").pop()?.toLowerCase() || "" : "";
  const type = extension || (url.toLowerCase().endsWith(".pdf") ? "pdf" : "file");
  const onBubble = compact && isMe;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "no-card-nav max-w-md select-none rounded-lg",
        compact
          ? onBubble
            ? "bg-brand-fg/10 p-2.5 text-brand-fg"
            : "bg-surface-muted p-2.5 text-fg"
          : "border border-border bg-surface p-3 text-fg",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-md",
            onBubble ? "bg-brand-fg/15" : "bg-brand-subtle text-brand-text"
          )}
          aria-hidden
        >
          <DocIcon extension={extension} className="size-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className={cn("text-xs", onBubble ? "opacity-80" : "text-fg-muted")}>
            <span className="font-medium">{type.toUpperCase()}</span>
            {size ? <span> · {formatFileSize(size)}</span> : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download={name}
            className={cn(
              "cl-interactive flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              onBubble
                ? "bg-brand-fg text-brand hover:opacity-90"
                : "bg-brand text-brand-fg hover:bg-brand-hover"
            )}
            aria-label={`Download ${name}`}
          >
            <Download className="size-4" aria-hidden />
          </a>

          {!compact && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-11 items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Open ${name} in a new tab`}
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
