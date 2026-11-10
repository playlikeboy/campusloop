import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "@/lib/utils";

/** Shared field chrome; Textarea and the Select trigger reuse it. */
export const fieldClassName = cn(
  "w-full min-w-0 rounded-md border border-border-strong bg-surface px-3.5 text-base text-fg",
  "transition-ui outline-none placeholder:text-fg-subtle",
  "focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-ring/25",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
  "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/20"
);

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        fieldClassName,
        "h-11 py-2 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-fg",
        className
      )}
      {...props}
    />
  );
}

export { Input };
