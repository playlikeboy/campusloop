import { AlertTriangle, Eye, Info, X } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const VARIANTS = {
  info: { className: "bg-brand-subtle text-brand-text", Icon: Info },
  preview: { className: "bg-reward-subtle text-reward-text", Icon: Eye },
  warning: { className: "bg-warning-subtle text-warning", Icon: AlertTriangle },
} as const;

export interface BannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: keyof typeof VARIANTS;
  title?: React.ReactNode;
  icon?: React.ReactNode | null;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

export function Banner({
  variant = "info",
  title,
  icon,
  action,
  onDismiss,
  className,
  children,
  ...props
}: BannerProps) {
  const { className: tone, Icon } = VARIANTS[variant];
  return (
    <div
      role={variant === "warning" ? "alert" : "status"}
      data-slot="banner"
      data-variant={variant}
      className={cn("flex items-start gap-3 rounded-md px-4 py-3 text-sm", tone, className)}
      {...props}
    >
      {icon === null ? null : (icon ?? <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />)}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-current/90")}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-current transition-colors outline-none hover:bg-fg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
