import { cn } from "@/lib/utils";

/**
 * Quiet, neutral "Not verified" marker for unverified members. Shown only on
 * their profile and in a post's author meta line, never as a warning.
 */
export function UnverifiedLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn("shrink-0 text-xs font-medium text-fg-subtle", className)}
      title="This member hasn't verified their student status yet"
    >
      Not verified
    </span>
  );
}
