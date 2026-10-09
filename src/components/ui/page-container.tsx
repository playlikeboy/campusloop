import React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "feed" | "content" | "wide";
  children: React.ReactNode;
}

export function PageContainer({
  size = "content",
  className,
  children,
  ...props
}: PageContainerProps) {
  const sizeClasses = {
    feed: "max-w-[640px]",
    content: "max-w-[960px]",
    wide: "max-w-[1200px]",
  }[size];

  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 transition-all",
        sizeClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
