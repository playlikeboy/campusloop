"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type * as React from "react";

import { fieldClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
  className,
  size = "md",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "md" }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        fieldClassName,
        "flex cursor-pointer items-center justify-between gap-2 text-left data-[placeholder]:text-fg-subtle data-[popup-open]:border-brand",
        size === "sm" ? "h-9 text-sm" : "h-11",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="text-fg-muted">
        <ChevronDown className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  sideOffset = 6,
  alignItemWithTrigger = false,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Popup> &
  Pick<React.ComponentProps<typeof SelectPrimitive.Positioner>, "sideOffset" | "alignItemWithTrigger">) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={sideOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="z-(--z-dropdown) outline-none"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "min-w-(--anchor-width) max-h-(--available-height) overflow-hidden rounded-md bg-surface-raised p-1 text-fg shadow-lg outline-none",
            "origin-(--transform-origin) transition-[opacity,transform] duration-(--dur-fast) data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow className="flex w-full cursor-default items-center justify-center py-1 text-fg-muted">
            <ChevronUp className="size-4" />
          </SelectPrimitive.ScrollUpArrow>
          <SelectPrimitive.List className="overflow-y-auto">{children}</SelectPrimitive.List>
          <SelectPrimitive.ScrollDownArrow className="flex w-full cursor-default items-center justify-center py-1 text-fg-muted">
            <ChevronDown className="size-4" />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-10 w-full cursor-pointer select-none items-center gap-2 rounded-sm py-2 pr-8 pl-3 text-sm text-fg outline-none",
        "data-[highlighted]:bg-brand-subtle data-[highlighted]:text-brand-text data-[selected]:font-semibold data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex-1 truncate">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex items-center text-brand-text">
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectGroupLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.GroupLabel>) {
  return (
    <SelectPrimitive.GroupLabel
      className={cn("px-3 py-1.5 text-xs font-semibold text-fg-muted", className)}
      {...props}
    />
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}

export { Select, SelectContent, SelectGroup, SelectGroupLabel, SelectItem, SelectSeparator, SelectTrigger, SelectValue };
