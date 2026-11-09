import type * as React from "react";

import { cn } from "@/lib/utils";

export const labelClassName =
  "block text-sm font-semibold leading-5 text-fg select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-60 data-[disabled]:opacity-60";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label data-slot="label" className={cn(labelClassName, className)} {...props}>
      {children}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-danger">
          *
        </span>
      )}
    </label>
  );
}
