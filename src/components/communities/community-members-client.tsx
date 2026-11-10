"use client";

import { CheckCircle2, Clock, Crown, Search, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { approveJoinRequest, rejectJoinRequest } from "@/app/(app)/(main)/communities/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommunityRoleBadge } from "./community-role-badge";

interface MemberItem {
  id: string;
  userId: string;
  role: string;
  status: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    points?: number | null;
    branch?: string | null;
    year?: number | null;
  };
}

interface CommunityMembersClientProps {
  communityId: string;
  communityName: string;
  members: MemberItem[];
  isAdmin: boolean;
}

export function CommunityMembersClient({
  communityId,
  communityName,
  members: initialMembers,
  isAdmin,
}: CommunityMembersClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingMembers = members.filter((m) => m.status === "PENDING");
  const activeMembers = members.filter((m) => m.status === "ACTIVE");

  const filteredActive = activeMembers.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.user.displayName.toLowerCase().includes(q) ||
      m.user.username.toLowerCase().includes(q) ||
      (m.user.branch || "").toLowerCase().includes(q)
    );
  });

  const admins = filteredActive.filter((m) => m.role === "ADMIN");
  const regularMembers = filteredActive.filter((m) => m.role !== "ADMIN");

  async function handleApprove(targetUserId: string) {
    setProcessingId(targetUserId);
    try {
      await approveJoinRequest(communityId, targetUserId);
      setMembers((prev) => prev.map((m) => (m.userId === targetUserId ? { ...m, status: "ACTIVE" } : m)));
      toast.success("Member approved");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Couldn't approve. Try again.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(targetUserId: string) {
    setProcessingId(targetUserId);
    try {
      await rejectJoinRequest(communityId, targetUserId);
      setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
      toast.success("Request declined");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Couldn't decline. Try again.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Search Box */}
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label={`Search members of c/${communityName}`}
          placeholder="Search members"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-16 pl-10"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute top-1/2 right-0.5 inline-flex min-h-10 -translate-y-1/2 cursor-pointer items-center rounded-full px-3 text-sm font-semibold text-fg-muted hover:text-fg"
          >
            Clear
          </button>
        )}
      </div>

      {/* Pending Join Requests (For Admins of Private Groups) */}
      {isAdmin && pendingMembers.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
              <Clock className="size-4 text-fg-muted" aria-hidden="true" /> Waiting to join (
              {pendingMembers.length})
            </h3>
          </div>

          <div className="divide-y divide-border/40">
            {pendingMembers.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                <Link href={`/@${m.user.username}`} className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={m.user.avatarUrl || ""} />
                    <AvatarFallback className="text-xs font-semibold">{m.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{m.user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{m.user.username} {m.user.branch ? `• ${m.user.branch}` : ""}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    loading={processingId === m.userId}
                    onClick={() => handleApprove(m.userId)}
                    aria-label={`Approve ${m.user.displayName}`}
                  >
                    {processingId !== m.userId && <CheckCircle2 />}
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={processingId === m.userId}
                    onClick={() => handleReject(m.userId)}
                    aria-label={`Decline ${m.user.displayName}`}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leadership & Admins */}
      <div className="space-y-2">
        <h3 className="flex items-center gap-1.5 px-1 text-sm font-semibold text-fg">
          <Crown className="size-3.5" aria-hidden="true" /> Admins and mods
        </h3>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {admins.map((m) => (
            <Link key={m.id} href={`/@${m.user.username}`}>
              <div className="rounded-2xl bg-card p-3.5 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={m.user.avatarUrl || ""} />
                    <AvatarFallback className="text-xs font-semibold">{m.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                      <span>{m.user.displayName}</span>
                      <Crown className="size-3 text-warning shrink-0" />
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{m.user.username} {m.user.branch ? `• ${m.user.branch}` : ""}
                    </p>
                  </div>
                </div>

                <CommunityRoleBadge role={m.role} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Members Directory */}
      <div className="space-y-2">
        <h3 className="flex items-center gap-1.5 px-1 text-sm font-semibold text-fg">
          <Users className="size-3.5 text-primary" /> Members ({regularMembers.length})
        </h3>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {regularMembers.map((m) => (
            <Link key={m.id} href={`/@${m.user.username}`}>
              <div className="rounded-2xl bg-card p-3.5 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={m.user.avatarUrl || ""} />
                    <AvatarFallback className="text-xs font-semibold">{m.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-foreground truncate">{m.user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{m.user.username} {m.user.branch ? `• ${m.user.branch}` : ""}
                    </p>
                  </div>
                </div>

                <CommunityRoleBadge role={m.role} />
              </div>
            </Link>
          ))}

          {regularMembers.length === 0 && (
            <div className="col-span-full py-10 text-center rounded-2xl bg-card text-muted-foreground text-xs font-semibold shadow-2xs">
              No other members matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
