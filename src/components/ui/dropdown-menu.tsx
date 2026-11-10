"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const DropdownMenu = Menu.Root;
const DropdownMenuTrigger = Menu.Trigger;
const DropdownMenuGroup = Menu.Group;
const DropdownMenuRadioGroup = Menu.RadioGroup;
const DropdownMenuSub = Menu.SubmenuRoot;

const POPUP =
  "z-(--z-dropdown) min-w-48 overflow-hidden rounded-md bg-surface-raised p-1 text-fg shadow-lg outline-none origin-(--transform-origin) transition-[opacity,transform] duration-(--dur-fast) data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0";

const ITEM =
  "relative flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm text-fg outline-none transition-colors data-[highlighted]:bg-brand-subtle data-[highlighted]:text-brand-text data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "start",
  side,
  ...props
}: React.ComponentProps<typeof Menu.Popup> &
  Pick<React.ComponentProps<typeof Menu.Positioner>, "sideOffset" | "align" | "side">) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={sideOffset} align={align} side={side} className="z-(--z-dropdown) outline-none">
        <Menu.Popup data-slot="dropdown-menu-content" className={cn(POPUP, className)} {...props} />
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof Menu.Item> & { variant?: "default" | "danger" }) {
  return (
    <Menu.Item
      data-slot="dropdown-menu-item"
      className={cn(ITEM, variant === "danger" && "text-danger data-[highlighted]:bg-danger-subtle data-[highlighted]:text-danger", className)}
      {...props}
    />
  );
}

function DropdownMenuLinkItem({ className, ...props }: React.ComponentProps<typeof Menu.LinkItem>) {
  return <Menu.LinkItem data-slot="dropdown-menu-link-item" className={cn(ITEM, className)} {...props} />;
}

function DropdownMenuCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof Menu.CheckboxItem>) {
  return (
    <Menu.CheckboxItem className={cn(ITEM, "pl-8", className)} {...props}>
      <Menu.CheckboxItemIndicator className="absolute left-2.5 flex items-center text-brand-text">
        <Check />
      </Menu.CheckboxItemIndicator>
      {children}
    </Menu.CheckboxItem>
  );
}

function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem className={cn(ITEM, "pl-8", className)} {...props}>
      <Menu.RadioItemIndicator className="absolute left-2.5 flex items-center text-brand-text">
        <Circle className="size-2! fill-current" />
      </Menu.RadioItemIndicator>
      {children}
    </Menu.RadioItem>
  );
}

function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof Menu.GroupLabel>) {
  return <Menu.GroupLabel className={cn("px-3 py-1.5 text-xs font-semibold text-fg-muted", className)} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("ml-auto text-xs tracking-wide text-fg-subtle", className)} {...props} />;
}

function DropdownMenuSubTrigger({ className, children, ...props }: React.ComponentProps<typeof Menu.SubmenuTrigger>) {
  return (
    <Menu.SubmenuTrigger className={cn(ITEM, "data-[popup-open]:bg-surface-muted", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto" />
    </Menu.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof Menu.Popup>) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={2} alignOffset={-4} className="z-(--z-dropdown) outline-none">
        <Menu.Popup className={cn(POPUP, className)} {...props} />
      </Menu.Positioner>
    </Menu.Portal>
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
