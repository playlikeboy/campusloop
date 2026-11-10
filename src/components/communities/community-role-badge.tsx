import { Crown, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface CommunityRoleBadgeProps {
  role?: string | null;
  className?: string;
  showMember?: boolean;
}

/** Admin / Moderator / Member label for a community member. */
export function CommunityRoleBadge({ role, className, showMember = true }: CommunityRoleBadgeProps) {
  const normalized = (role || "MEMBER").toUpperCase();

  if (normalized === "ADMIN") {
    return (
      <Badge variant="outline" className={className}>
        <Crown />
        Admin
      </Badge>
    );
  }

  if (normalized === "MODERATOR") {
    return (
      <Badge variant="outline" className={className}>
        <ShieldCheck />
        Moderator
      </Badge>
    );
  }

  if (!showMember) return null;
  return <Badge className={className}>Member</Badge>;
}
