"use client";

import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-(--z-modal) flex items-end justify-center bg-overlay p-3 animate-in fade-in duration-200 sm:items-center sm:p-4">
        <div className="fixed inset-0" onClick={() => onOpenChange(false)} aria-hidden="true" />
        {children}
      </div>
    </DialogContext.Provider>
  );
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(DialogContext);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "relative w-full max-w-lg rounded-xl bg-surface-raised p-5 text-fg shadow-lg sticker-pop sm:p-6",
        className
      )}
    >
      <button
        type="button"
        onClick={() => ctx?.onOpenChange(false)}
        aria-label="Close"
        className="absolute top-3 right-3 flex size-10 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring sm:top-4 sm:right-4"
      >
        <X className="size-4" />
      </button>
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}>{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={cn("pr-10 font-display text-xl leading-tight font-bold text-fg", className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-sm text-fg-muted", className)}>{children}</p>;
}
