import Link from "next/link";
import type * as React from "react";

import { cn } from "@/lib/utils";

export interface MentionTagProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** Username without the leading @. */
  username: string;
  /** Profile link. Without it the tag renders as plain text. */
  href?: string;
  size?: "sm" | "md";
}

/** @mention pill, as on Stories. Pressable when it has an href. */
export function MentionTag({ username, href, size = "md", className, ...props }: MentionTagProps) {
  const classes = cn(
    "inline-flex max-w-full items-center rounded-full bg-brand-subtle font-semibold text-brand-text",
    size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-sm",
    href &&
      "transition-ui outline-none hover:bg-brand hover:text-brand-fg focus-visible:ring-2 focus-visible:ring-ring",
    className
  );
  const label = <span className="truncate">@{username.replace(/^@/, "")}</span>;
  if (href) {
    return (
      <Link href={href} data-slot="mention-tag" className={classes} {...props}>
        {label}
      </Link>
    );
  }
  return (
    <span data-slot="mention-tag" className={classes} {...props}>
      {label}
    </span>
  );
}
