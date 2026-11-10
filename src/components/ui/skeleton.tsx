import type * as React from "react";

import { cn } from "@/lib/utils";

/** Loading placeholder. Match the shape of what is loading; never a spinner in its place. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
