"use client";

import { X } from "lucide-react";
import * as React from "react";
import { Drawer } from "vaul";

import { cn } from "@/lib/utils";

type Side = "bottom" | "top" | "left" | "right";

const SideContext = React.createContext<Side>("bottom");

export type SheetProps = Parameters<typeof Drawer.Root>[0] & {
  side?: Side;
  children?: React.ReactNode;
};

/** Edge-anchored panel built on vaul. Bottom sheets get the drag handle. */
function Sheet({ side = "bottom", children, ...props }: SheetProps) {
  return (
    <SideContext.Provider value={side}>
      <Drawer.Root direction={side} {...props}>
        {children}
      </Drawer.Root>
    </SideContext.Provider>
  );
}

const SheetTrigger = Drawer.Trigger;
const SheetClose = Drawer.Close;

const SIDE_CLASSES: Record<Side, string> = {
  bottom: "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-xl pb-safe",
  top: "inset-x-0 top-0 max-h-[92dvh] rounded-b-xl",
  left: "inset-y-0 left-0 h-full w-[88vw] max-w-sm",
  right: "inset-y-0 right-0 h-full w-[88vw] max-w-sm",
};

function SheetContent({
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof Drawer.Content> & { showClose?: boolean }) {
  const side = React.useContext(SideContext);
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-(--z-modal) bg-overlay" />
      <Drawer.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-(--z-modal) flex flex-col bg-surface text-fg shadow-lg outline-none",
          SIDE_CLASSES[side],
          className
        )}
        {...props}
      >
        {side === "bottom" && <Drawer.Handle className="mt-3 mb-1 !w-10 !bg-border-strong" />}
        {showClose && (
          <Drawer.Close
            aria-label="Close"
            className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors outline-none hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <X className="size-4" />
          </Drawer.Close>
        )}
        {children}
      </Drawer.Content>
    </Drawer.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1 px-5 pt-4 pb-3", className)} {...props} />;
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-body" className={cn("min-h-0 flex-1 overflow-y-auto px-5 pb-5", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof Drawer.Title>) {
  return <Drawer.Title className={cn("text-lg font-semibold tracking-tight text-fg", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof Drawer.Description>) {
  return <Drawer.Description className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger };
