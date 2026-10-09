import React from "react";
import { cn } from "@/lib/utils";

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FilterBar({ className, children, ...props }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5 w-full scroll-smooth",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
