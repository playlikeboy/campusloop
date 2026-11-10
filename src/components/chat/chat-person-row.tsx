import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { UserProfile } from "@/db/schema";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./chat-avatar";

interface ChatPersonRowProps {
  user: UserProfile;
  onClick: () => void;
  selected?: boolean;
  /** Right-hand slot: a checkbox mark, an icon, etc. */
  trailing?: React.ReactNode;
  disabled?: boolean;
  /** Use `aria-pressed` for multi-select lists. */
  toggle?: boolean;
}

/** A student in a search or picker list: avatar, name, @username and branch. */
export function ChatPersonRow({ user, onClick, selected, trailing, disabled, toggle }: ChatPersonRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={toggle ? Boolean(selected) : undefined}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-ui outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60",
        selected ? "bg-brand-subtle" : "hover:bg-surface-muted"
      )}
    >
      <ChatAvatar name={user.displayName} src={user.avatarUrl} className="size-11" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-base font-semibold text-fg">{user.displayName}</span>
          {user.isCollegeVerified && <VerifiedBadge size="sm" />}
        </span>
        <span className="block truncate text-sm text-fg-muted">
          @{user.username}
          {user.branch ? ` · ${user.branch}` : ""}
        </span>
      </span>
      {trailing}
    </button>
  );
}
