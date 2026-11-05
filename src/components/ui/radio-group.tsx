"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import type * as React from "react";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive>) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn("flex flex-col gap-3", className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof Radio.Root>) {
  return (
    <Radio.Root
      data-slot="radio-group-item"
      className={cn(
        "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border-strong bg-surface",
        "transition-colors outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "hover:border-brand data-[checked]:border-brand data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 aria-invalid:border-danger",
        className
      )}
      {...props}
    >
      <Radio.Indicator
        data-slot="radio-group-indicator"
        className="size-2.5 rounded-full bg-brand data-[unchecked]:hidden"
      />
    </Radio.Root>
  );
}

/** Label-wrapped radio for the common "option with text" case. */
function RadioOption({
  value,
  children,
  description,
  className,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 text-sm", disabled && "cursor-not-allowed opacity-60", className)}>
      <RadioGroupItem value={value} disabled={disabled} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-fg">{children}</span>
        {description && <span className="text-fg-muted">{description}</span>}
      </span>
    </label>
  );
}

export { RadioGroup, RadioGroupItem, RadioOption };
