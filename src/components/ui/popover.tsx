"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type * as React from "react";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverClose = PopoverPrimitive.Close;

function PopoverContent({
  className,
  sideOffset = 8,
  align = "center",
  side,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> &
  Pick<React.ComponentProps<typeof PopoverPrimitive.Positioner>, "sideOffset" | "align" | "side">) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner sideOffset={sideOffset} align={align} side={side} className="z-(--z-dropdown) outline-none">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "w-72 rounded-md bg-surface-raised p-4 text-sm text-fg shadow-lg outline-none",
            "origin-(--transform-origin) transition-[opacity,transform] duration-(--dur-fast) data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverTitle({ className, ...props }: React.ComponentProps<typeof PopoverPrimitive.Title>) {
  return <PopoverPrimitive.Title className={cn("text-base font-semibold text-fg", className)} {...props} />;
}

function PopoverDescription({ className, ...props }: React.ComponentProps<typeof PopoverPrimitive.Description>) {
  return <PopoverPrimitive.Description className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export { Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger };
