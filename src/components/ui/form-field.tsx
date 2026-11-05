"use client";

import { Field } from "@base-ui/react/field";
import type * as React from "react";

import { labelClassName } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends Omit<React.ComponentProps<typeof Field.Root>, "invalid"> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** When set the field renders invalid and the message is linked via aria-describedby. */
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}

/**
 * Label + control + hint + error. Any control that is a Base UI Field.Control
 * (our Input, Textarea, Select trigger, Checkbox, Switch, RadioGroup) is linked
 * to the label, hint and error automatically; other children render as-is.
 */
export function FormField({ label, hint, error, required, className, children, ...props }: FormFieldProps) {
  return (
    <Field.Root
      data-slot="form-field"
      invalid={Boolean(error)}
      className={cn("flex w-full flex-col gap-1.5", className)}
      {...props}
    >
      {label && (
        <Field.Label className={labelClassName}>
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          )}
        </Field.Label>
      )}
      {children}
      {hint && !error && <Field.Description className="text-sm text-fg-muted">{hint}</Field.Description>}
      {error && (
        <Field.Error match className="text-sm text-danger" role="alert">
          {error}
        </Field.Error>
      )}
    </Field.Root>
  );
}
