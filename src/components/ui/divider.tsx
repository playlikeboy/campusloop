import { Separator } from "@base-ui/react/separator";
import type * as React from "react";

import { cn } from "@/lib/utils";

export interface DividerProps extends React.ComponentProps<typeof Separator> {
  /** Short text centred on the line, e.g. "or". */
  label?: React.ReactNode;
}

export function Divider({ label, orientation = "horizontal", className, ...props }: DividerProps) {
  if (label && orientation === "horizontal") {
    return (
      <div role="separator" className={cn("flex items-center gap-3 text-xs text-fg-subtle", className)}>
        <Separator className="h-px flex-1 bg-border" {...props} />
        <span className="shrink-0">{label}</span>
        <Separator className="h-px flex-1 bg-border" {...props} />
      </div>
    );
  }
  return (
    <Separator
      data-slot="divider"
      orientation={orientation}
      className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
      {...props}
    />
  );
}
