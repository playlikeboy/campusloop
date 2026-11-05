"use client";

import { AlertTriangle, CheckCircle2, Info, Loader2, Trash2, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const icons = {
    danger: <Trash2 className="size-5 text-destructive" />,
    warning: <AlertTriangle className="size-5 text-warning" />,
    info: <Info className="size-5 text-brand-text" />,
    success: <CheckCircle2 className="size-5 text-success" />,
  };

  const bgVariants = {
    danger: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-warning-subtle text-warning border-warning/20",
    info: "bg-brand-subtle text-brand-text border-brand-subtle-border",
    success: "bg-success-subtle text-success border-success/20",
  };

  const btnVariants = {
    danger: "bg-danger hover:bg-danger/90 text-danger-fg",
    warning: "bg-warning hover:bg-warning/90 text-warning-fg",
    info: "bg-brand hover:bg-brand-hover text-brand-fg",
    success: "bg-success hover:bg-success/90 text-success-fg",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-10 rounded-2xl border flex items-center justify-center shrink-0",
                bgVariants[variant]
              )}
            >
              {icons[variant]}
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground tracking-tight">{title}</h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            aria-label="Close dialog"
            className="size-9 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer disabled:opacity-50 transition-colors outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {children}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/50">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="h-9 min-h-[36px] px-4 rounded-xl border border-border/70 bg-muted/30 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(
              "h-9 min-h-[36px] px-4 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
              btnVariants[variant]
            )}
          >
            {isLoading && <Loader2 className="size-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
