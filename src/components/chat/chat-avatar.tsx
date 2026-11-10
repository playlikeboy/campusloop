import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PresenceDot } from "@/components/ui/presence-dot";
import { cn } from "@/lib/utils";
import { initialOf } from "./chat-format";

interface ChatAvatarProps {
  name?: string | null;
  src?: string | null;
  /** Shows the online dot when the heartbeat is recent. Leave out for groups. */
  lastSeenAt?: Date | string | null;
  showPresence?: boolean;
  className?: string;
}

/** Avatar with initial fallback and optional presence dot, sized by `className` (default 48px). */
export function ChatAvatar({ name, src, lastSeenAt, showPresence = false, className }: ChatAvatarProps) {
  return (
    <div className="relative shrink-0">
      <Avatar className={cn("size-12", className)}>
        <AvatarImage src={src || ""} alt="" />
        <AvatarFallback className="bg-brand-subtle font-semibold text-brand-text">
          {initialOf(name)}
        </AvatarFallback>
      </Avatar>
      {showPresence && <PresenceDot lastSeenAt={lastSeenAt} />}
    </div>
  );
}
