"use client";

import { format } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Radio,
  School,
  SearchIcon,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminFilterRow } from "@/app/admin/_components/admin-filter-row";
import { CollegeCombobox } from "@/components/common/college-combobox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fieldClassName } from "@/components/ui/input";
import { isOnline, presenceLabel } from "@/lib/presence";
import { cn, formatTimeAgo } from "@/lib/utils";
import { AdminStatStrip } from "../_components/admin-stat-strip";
import { createUserProfile, deleteUserProfile, updateUserRole, updateUserStatus } from "./actions";

export interface UserAnalyticsStats {
  total: number;
  active: number;
  suspended: number;
  banned: number;
  students: number;
  moderators: number;
  admins: number;
  onlineNow: number;
  activeToday: number;
  recent7d: number;
  verifiedBadge: number;
  avgPoints: number;
}

export interface UserRow {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  role: "STUDENT" | "MODERATOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  institution?: { name: string; slug?: string | null } | null;
  course?: string | null;
  branch?: string | null;
  year?: number | null;
  gender?: string | null;
  points?: number | null;
  createdAt: Date | string;
  lastSeenAt?: Date | string | null;
}

type RoleFilter = "ALL" | "STUDENT" | "MODERATOR" | "ADMIN";
type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED" | "BANNED";
type SortFilter = "RECENT" | "ACTIVE" | "POINTS" | "OLDEST";

interface UsersTableProps {
  initialUsers: UserRow[];
  page: number;
  totalPages: number;
  totalCount: number;
  institutions: { id: string; name: string }[];
  activeRole: RoleFilter;
  activeStatus: StatusFilter;
  activeSort: SortFilter;
  analytics: UserAnalyticsStats;
}

const roleTabs: { value: RoleFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "STUDENT", label: "Students" },
  { value: "MODERATOR", label: "Moderators" },
  { value: "ADMIN", label: "Admins" },
];

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "BANNED", label: "Banned" },
];

const sortTabs: { value: SortFilter; label: string; icon: typeof Calendar }[] = [
  { value: "RECENT", label: "Newest first", icon: Calendar },
  { value: "ACTIVE", label: "Recently active", icon: Radio },
  { value: "POINTS", label: "Most Loop Points", icon: Zap },
  { value: "OLDEST", label: "Oldest first", icon: Users },
];

export function UsersTable({
  initialUsers,
  page,
  totalPages,
  totalCount,
  institutions,
  activeRole,
  activeStatus,
  activeSort,
  analytics,
}: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  // Create User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newInstitutionId, setNewInstitutionId] = useState("");
  const [newRole, setNewRole] = useState<UserRow["role"]>("STUDENT");
  const [newStatus, setNewStatus] = useState<UserRow["status"]>("ACTIVE");
  const [isCreating, setIsCreating] = useState(false);

  // Set default institutionId
  useEffect(() => {
    if (institutions && institutions.length > 0 && !newInstitutionId) {
      setNewInstitutionId(institutions[0].id);
    }
  }, [institutions, newInstitutionId]);

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`/admin/users?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushParams((params) => {
      if (search.trim()) {
        params.set("q", search);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
    });
  }

  function handlePageChange(newPage: number) {
    pushParams((params) => {
      params.set("page", newPage.toString());
    });
  }

  async function handleRoleChange(profileId: string, role: "STUDENT" | "MODERATOR" | "ADMIN") {
    setIsLoading(profileId);
    try {
      await updateUserRole(profileId, role);
      toast.success("Role updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setIsLoading(null);
    }
  }

  async function handleStatusChange(profileId: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") {
    setIsLoading(profileId);
    try {
      await updateUserStatus(profileId, status);
      toast.success("Status updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setIsLoading(null);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newDisplayName.trim() || !newUsername.trim() || !newInstitutionId) {
      toast.error("Add a name, a username and a college first.");
      return;
    }

    setIsCreating(true);
    try {
      await createUserProfile({
        displayName: newDisplayName,
        username: newUsername,
        institutionId: newInstitutionId,
        role: newRole,
        status: newStatus,
      });
      setNewDisplayName("");
      setNewUsername("");
      setShowAddForm(false);
      toast.success("Account created");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;
    setIsLoading(userToDelete.id);
    try {
      await deleteUserProfile(userToDelete.id);
      toast.success("Account deleted");
      setUserToDelete(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user.");
    } finally {
      setIsLoading(null);
    }
  }

  function formatExact(dateVal?: Date | string | null) {
    if (!dateVal) return "";
    try {
      return format(new Date(dateVal), "dd MMM yyyy, hh:mm a");
    } catch {
      return "";
    }
  }

  function formatShort(dateVal?: Date | string | null) {
    if (!dateVal) return "";
    try {
      return format(new Date(dateVal), "dd MMM, hh:mm a");
    } catch {
      return "";
    }
  }

  return (
    <div className="space-y-6">
      <AdminStatStrip
        items={[
          {
            label: "Accounts",
            value: analytics.total.toLocaleString("en-IN"),
            note: `${analytics.students} students · ${analytics.moderators} mods · ${analytics.admins} admins`,
          },
          {
            label: "Online now",
            value: analytics.onlineNow,
            note: `${analytics.activeToday} active in the last 24 hours`,
          },
          {
            label: "New this week",
            value: analytics.recent7d.toLocaleString("en-IN"),
            note: "Signups in the last 7 days",
          },
          {
            label: "Verified badge",
            value: analytics.verifiedBadge.toLocaleString("en-IN"),
            note: `150+ Loop Points · average ${analytics.avgPoints}`,
          },
        ]}
      />

      {/* Search and filters */}
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
            <input
              aria-label="Search students"
              type="text"
              placeholder="Search by name, @username or college"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(fieldClassName, "w-full pl-9 pr-4 h-11")}
            />
          </form>

          {/* Add User Button */}
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(buttonVariants({ variant: "primary", size: "sm" }), "shrink-0")}
          >
            <UserPlus className="size-3.5" />
            <span>{showAddForm ? "Close" : "Add account"}</span>
          </button>
        </div>

        {/* Filter Pills: Roles, Statuses, and Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border text-xs">
          {/* Left: Role & Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <AdminFilterRow
              label="Role"
              options={roleTabs}
              value={activeRole}
              onChange={(v) =>
                pushParams((params) => {
                  params.set("role", v);
                  params.set("page", "1");
                })
              }
            />
            <AdminFilterRow
              label="Status"
              options={statusTabs}
              value={activeStatus}
              onChange={(v) =>
                pushParams((params) => {
                  params.set("status", v);
                  params.set("page", "1");
                })
              }
            />
          </div>

          {/* Right: Sort By Selection */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-fg-muted">Sort:</span>
            <select
              aria-label="Sort by"
              value={activeSort}
              onChange={(e) =>
                pushParams((params) => {
                  params.set("sort", e.target.value);
                  params.set("page", "1");
                })
              }
              className={cn(fieldClassName, "h-11")}
            >
              {sortTabs.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Create User Form Drawer ─── */}
      {showAddForm && (
        <form
          onSubmit={handleCreateUser}
          className="space-y-4 rounded-lg border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
              <Plus className="size-4 text-fg-muted" aria-hidden /> Add an account
            </h3>
            <span className="text-xs text-fg-muted">
              Create an account by hand, for testing or to help someone sign up.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="users-table-display-name" className="text-sm font-medium text-fg">
                Display Name
              </label>
              <input
                id="users-table-display-name"
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className={cn(fieldClassName, "w-full h-11")}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="users-table-username" className="text-sm font-medium text-fg">
                Username
              </label>
              <input
                id="users-table-username"
                type="text"
                required
                placeholder="e.g. priya.sharma"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className={cn(fieldClassName, "w-full h-11")}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <span className="block text-sm font-medium text-fg">College</span>
              <CollegeCombobox
                value={newInstitutionId}
                initialInstitutions={institutions}
                onChange={(id) => setNewInstitutionId(id)}
                placeholder="Search colleges"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="users-table-role" className="text-sm font-medium text-fg">
                Role
              </label>
              <select
                id="users-table-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRow["role"])}
                className={cn(fieldClassName, "w-full h-11")}
              >
                <option value="STUDENT">Student</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="users-table-status" className="text-sm font-medium text-fg">
                Status
              </label>
              <select
                id="users-table-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as UserRow["status"])}
                className={cn(fieldClassName, "w-full h-11")}
              >
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              {isCreating ? "Adding account" : "Add account"}
            </button>
          </div>
        </form>
      )}

      {/* ─── Users Table ─── */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs text-fg-muted">
            <thead className="bg-surface-muted border-b border-border text-xs font-bold text-fg">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Campus</th>
                <th className="px-5 py-3.5">Signed Up</th>
                <th className="px-5 py-3.5">Last Active</th>
                <th className="px-4 py-3.5 text-center">Loop Points</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-fg-muted">
                    No accounts match. Try another search or filter.
                  </td>
                </tr>
              ) : (
                initialUsers.map((p) => {
                  const online = isOnline(p.lastSeenAt);
                  const activeLabel = presenceLabel(p.lastSeenAt);
                  const exactCreatedAt = formatExact(p.createdAt);
                  const exactLastSeenAt = formatExact(p.lastSeenAt);
                  const hasBlueBadge = (p.points ?? 0) >= 150;

                  return (
                    <tr key={p.id} className="hover:bg-surface-muted transition-colors">
                      {/* Column 1: Student Details */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="size-9 border border-border shrink-0">
                              <AvatarImage src={p.avatarUrl || ""} alt={p.displayName} />
                              <AvatarFallback className="text-xs font-bold bg-surface-muted text-fg">
                                {p.displayName?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            {online && (
                              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-success border-2 border-card" />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1">
                              <span
                                className="font-bold text-fg truncate max-w-[140px]"
                                title={p.displayName}
                              >
                                {p.displayName}
                              </span>
                              {hasBlueBadge && (
                                <span title="Verified badge (150+ Loop Points)">
                                  <ShieldCheck
                                    className="size-3.5 shrink-0 text-verified-text"
                                    aria-label="Verified badge"
                                  />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                              <Link
                                href={`/@${p.username}`}
                                target="_blank"
                                className="hover:text-brand-text transition-colors truncate max-w-[110px]"
                                title={`@${p.username}`}
                              >
                                @{p.username}
                              </Link>
                              {(p.branch || p.year) && (
                                <>
                                  <span>·</span>
                                  <span
                                    className="truncate max-w-[90px]"
                                    title={`${p.branch || ""} ${p.year ? `'${p.year.toString().slice(-2)}` : ""}`}
                                  >
                                    {p.branch || "Student"} {p.year ? `'${p.year.toString().slice(-2)}` : ""}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Campus / Institution */}
                      <td className="px-5 py-3.5">
                        <div
                          className="flex items-center gap-1.5 min-w-0 max-w-[180px]"
                          title={p.institution?.name || "No College"}
                        >
                          <School className="size-3.5 text-fg-muted shrink-0" />
                          <span className="font-medium text-fg truncate">
                            {p.institution?.name?.split(",")[0] || "Independent Student"}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Signed Up (Human Readable) */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col" title={`Signed up on: ${exactCreatedAt}`}>
                          <span className="font-bold text-fg">
                            {formatTimeAgo(p.createdAt) || "Recently"}
                          </span>
                          <span className="text-xs text-fg-muted">{formatShort(p.createdAt)}</span>
                        </div>
                      </td>

                      {/* Column 4: Last Active (Human Readable + Presence Status) */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {online ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-subtle text-success border border-success/25"
                            title={`Active right now (Last ping: ${exactLastSeenAt || "Just now"})`}
                          >
                            <span className="size-1.5 rounded-full bg-success" />
                            Active now
                          </span>
                        ) : p.lastSeenAt ? (
                          <div className="flex flex-col" title={`Last seen: ${exactLastSeenAt}`}>
                            <span className="font-bold text-fg">
                              {activeLabel || formatTimeAgo(p.lastSeenAt)}
                            </span>
                            <span className="text-xs text-fg-muted">{formatShort(p.lastSeenAt)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-fg-subtle italic">Never active</span>
                        )}
                      </td>

                      {/* Column 5: Loop Points */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-reward-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-reward-text"
                          title={`Loop Points: ${p.points ?? 0}`}
                        >
                          <Zap className="size-3" aria-hidden />
                          {(p.points ?? 0).toLocaleString("en-IN")} LP
                        </span>
                      </td>

                      {/* Column 6: Role */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <select
                          value={p.role}
                          disabled={isLoading === p.id}
                          onChange={(e) => handleRoleChange(p.id, e.target.value as UserRow["role"])}
                          aria-label={`Role for @${p.username}`}
                          className={cn(fieldClassName, "h-11")}
                        >
                          <option value="STUDENT">Student</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>

                      {/* Column 7: Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <select
                          value={p.status}
                          disabled={isLoading === p.id}
                          onChange={(e) => handleStatusChange(p.id, e.target.value as UserRow["status"])}
                          aria-label={`Status for @${p.username}`}
                          className={cn(
                            fieldClassName,
                            "h-11 font-semibold",
                            p.status === "ACTIVE"
                              ? "text-success"
                              : p.status === "SUSPENDED"
                                ? "text-warning"
                                : "text-danger"
                          )}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="SUSPENDED">Suspended</option>
                          <option value="BANNED">Banned</option>
                        </select>
                      </td>

                      {/* Column 8: Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <Link
                            href={`/@${p.username}`}
                            target="_blank"
                            rel="noopener"
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            title="View public profile"
                            aria-label={`View @${p.username}'s profile (opens in a new tab)`}
                          >
                            <ExternalLink aria-hidden />
                          </Link>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isLoading === p.id}
                            onClick={() => setUserToDelete({ id: p.id, name: p.displayName })}
                            title="Delete account"
                            aria-label="Delete account"
                            className="hover:bg-danger-subtle hover:text-danger"
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Table Pagination ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-surface-muted border-t border-border text-xs text-fg-muted">
          <div>
            Showing <strong className="text-fg">{initialUsers.length}</strong> of{" "}
            <strong className="text-fg">{totalCount.toLocaleString()}</strong> student accounts
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ChevronLeft className="size-3.5" />
              <span>Previous</span>
            </button>

            <span className="font-semibold text-fg px-1">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Delete Confirmation Dialog ─── */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        title="Delete this account?"
        description={`${userToDelete?.name}'s posts, comments and Loop Points will be deleted too. This can't be undone.`}
        confirmText="Delete account"
        onConfirm={handleDeleteUser}
        onClose={() => setUserToDelete(null)}
      />
    </div>
  );
}
