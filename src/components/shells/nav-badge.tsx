import { Badge } from "@/components/ui/badge";
import type { NavBadgeTone } from "@/constants/navigation";
import { cn } from "@/lib/utils";

/** Nav badge text rendered through the Badge primitive; tone names are Badge variants 1:1. */
export function NavBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: NavBadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge variant={tone} className={cn("shrink-0", className)}>
      {children}
    </Badge>
  );
}
