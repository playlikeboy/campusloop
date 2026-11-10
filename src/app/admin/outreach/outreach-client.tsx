"use client";

import {
  AlertCircle,
  CheckCheck,
  Clock,
  Copy,
  Eye,
  Loader2,
  Mail,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useEscapeKey } from "@/app/admin/_components/use-escape-key";
import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fieldClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  email: string;
  collegeName: string;
  collegeSlug: string;
  role: string;
  status: string;
  notes: string | null;
  source: string | null;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  lastError: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Metrics {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  replied: number;
  replyRate: number;
}

interface CollegeOption {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  district: string | null;
}

interface OutreachClientProps {
  initialContacts: Contact[];
  initialMetrics: Metrics;
  colleges: CollegeOption[];
}

export function OutreachClient({ initialContacts, initialMetrics, colleges }: OutreachClientProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "SENT" | "REPLIED">("ALL");
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [sendingContactId, setSendingContactId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  useEscapeKey(isAddModalOpen, () => setIsAddModalOpen(false));
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  useEscapeKey(isPreviewModalOpen, () => setIsPreviewModalOpen(false));
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Contact Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newCollegeSlug, setNewCollegeSlug] = useState("");
  const [newRole, setNewRole] = useState("Campus Representative");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Filter contacts by search & status
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "PENDING"
            ? c.status === "PENDING"
            : statusFilter === "SENT"
              ? ["SENT", "DELIVERED", "OPENED"].includes(c.status)
              : statusFilter === "REPLIED"
                ? c.status === "REPLIED"
                : true;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.collegeName.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [contacts, searchQuery, statusFilter]);

  async function refreshData() {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/outreach");
      const data = (await res.json()) as { success?: boolean; contacts?: Contact[]; metrics?: Metrics };
      if (data.success && data.contacts && data.metrics) {
        setContacts(data.contacts);
        setMetrics(data.metrics);
        toast.success("List refreshed");
      }
    } catch {
      toast.error("Couldn't refresh the list. Try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSendSingle(contact: Contact) {
    setSendingContactId(contact.id);
    try {
      const res = await fetch("/api/admin/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        successCount?: number;
        results?: Array<{ error?: string }>;
        error?: string;
      };
      if (data.success && (data.successCount ?? 0) > 0) {
        toast.success(`Invite sent to ${contact.name}`);
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id
              ? { ...c, status: "SENT", sentAt: new Date().toISOString(), lastError: null }
              : c
          )
        );
        setMetrics((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          sent: prev.sent + 1,
        }));
      } else {
        toast.error(data.results?.[0]?.error || data.error || "Failed to dispatch email");
      }
    } catch {
      toast.error("Couldn't send the email. Check your connection and try again.");
    } finally {
      setSendingContactId(null);
    }
  }

  async function handleSendAllPending() {
    if (metrics.pending === 0) {
      toast.info("Everyone has been invited already");
      return;
    }

    const confirmSend = window.confirm(
      `Are you sure you want to send invitations to all ${metrics.pending} pending campus contacts?`
    );
    if (!confirmSend) return;

    setIsSendingAll(true);
    toast.loading("Sending invites", { id: "outreach-send-all" });

    try {
      const res = await fetch("/api/admin/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendAllPending: true }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        successCount?: number;
        failCount?: number;
        error?: string;
      };

      if (data.success) {
        toast.success(`Sent ${data.successCount ?? 0} invites (${data.failCount ?? 0} failed)`, {
          id: "outreach-send-all",
        });
        await refreshData();
      } else {
        toast.error(data.error || "Batch sending failed", { id: "outreach-send-all" });
      }
    } catch {
      toast.error("Couldn't send the invites. Check your connection and try again.", {
        id: "outreach-send-all",
      });
    } finally {
      setIsSendingAll(false);
    }
  }

  async function handleToggleReplied(contact: Contact) {
    const isCurrentlyReplied = contact.status === "REPLIED";
    const nextStatus = isCurrentlyReplied ? "SENT" : "REPLIED";

    try {
      const res = await fetch("/api/admin/outreach", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contact.id,
          status: nextStatus,
          replied: !isCurrentlyReplied,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        toast.success(isCurrentlyReplied ? "Marked as not replied" : "Marked as replied");
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id
              ? {
                  ...c,
                  status: nextStatus,
                  repliedAt: !isCurrentlyReplied ? new Date().toISOString() : null,
                }
              : c
          )
        );
        setMetrics((prev) => ({
          ...prev,
          replied: isCurrentlyReplied ? Math.max(0, prev.replied - 1) : prev.replied + 1,
        }));
      }
    } catch {
      toast.error("Couldn't update the status. Try again.");
    }
  }

  async function handleDelete(contactId: string) {
    const confirmDelete = window.confirm("Delete this contact from the outreach registry?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/outreach?id=${contactId}`, { method: "DELETE" });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        toast.success("Contact removed");
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
        setMetrics((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      }
    } catch {
      toast.error("Couldn't remove the contact. Try again.");
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newCollegeName.trim()) {
      toast.error("Add a name, an email and a college first.");
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await fetch("/api/admin/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          collegeName: newCollegeName,
          collegeSlug: newCollegeSlug,
          role: newRole,
          notes: newNotes,
        }),
      });
      const data = (await res.json()) as { success?: boolean; contact?: Contact; error?: string };
      if (data.success && data.contact) {
        toast.success("Contact added");
        setContacts((prev) => [data.contact!, ...prev]);
        setMetrics((prev) => ({
          ...prev,
          total: prev.total + 1,
          pending: prev.pending + 1,
        }));
        setIsAddModalOpen(false);
        setNewName("");
        setNewEmail("");
        setNewCollegeName("");
        setNewCollegeSlug("");
        setNewNotes("");
      } else {
        toast.error(data.error || "Failed to add contact");
      }
    } catch {
      toast.error("Couldn't add the contact. Check your connection and try again.");
    } finally {
      setIsSubmittingNew(false);
    }
  }

  function handleSelectCollege(col: CollegeOption) {
    setNewCollegeName(col.name);
    setNewCollegeSlug(col.slug);
  }

  function copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6">
      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-border bg-surface p-4 ">
          <div className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
            <Users className="size-4 text-brand-text" />
            Total Leads
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-fg">{metrics.total}</p>
          <span className="text-xs text-fg-muted">Indexed campus contacts</span>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 ">
          <div className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
            <Clock className="size-4 text-warning" />
            Pending Outreach
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-warning">{metrics.pending}</p>
          <span className="text-xs text-fg-muted">Ready to email</span>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 ">
          <div className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
            <Send className="size-4 text-brand-text" />
            Sent
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-fg">{metrics.sent}</p>
          <span className="text-xs text-fg-muted">Emails sent</span>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 ">
          <div className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
            <CheckCheck className="size-4 text-brand-text" />
            Delivered
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-fg">{metrics.delivered}</p>
          <span className="text-xs text-fg-muted">Inbox delivery confirmed</span>
        </div>

        <div className="col-span-2 rounded-lg border border-border bg-surface p-4  sm:col-span-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
            <MessageSquareText className="size-4 text-success" />
            Replied ({metrics.replyRate}%)
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-success">{metrics.replied}</p>
          <span className="text-xs text-fg-muted">Responses received</span>
        </div>
      </div>

      {/* ─── Controls & Actions Bar ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center rounded-lg border border-border bg-surface-muted p-1">
            {(["ALL", "PENDING", "SENT", "REPLIED"] as const).map((tab) => (
              <Chip size="sm" selected={statusFilter === tab} key={tab} onClick={() => setStatusFilter(tab)}>
                {tab === "ALL" && `All (${metrics.total})`}
                {tab === "PENDING" && `Pending (${metrics.pending})`}
                {tab === "SENT" && `Sent (${metrics.sent})`}
                {tab === "REPLIED" && `Replied (${metrics.replied})`}
              </Chip>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void refreshData()}
            disabled={isRefreshing}
            className={buttonVariants({ variant: "outline", size: "sm" })}
            title="Refresh"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 sm:w-64 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted" />
            <input
              aria-label="Search contacts"
              type="text"
              placeholder="Search name, email or college"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(fieldClassName, "w-full pl-8 pr-3 h-11")}
            />
            {searchQuery && (
              <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setSearchQuery("")}>
                <X aria-hidden />
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={() => void handleSendAllPending()}
            disabled={isSendingAll || metrics.pending === 0}
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            {isSendingAll ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            <span>Send All Pending ({metrics.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="size-3.5" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* ─── Contacts Table ─── */}
      <div className="rounded-lg border border-border bg-surface  overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-xs font-semibold text-fg-muted">
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-fg-muted">
                    <Mail className="mx-auto size-8 text-fg-subtle mb-2" />
                    <p className="font-semibold text-fg text-sm">No contacts match</p>
                    <p className="text-xs mt-1">Try another search or filter.</p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => {
                  const isSendingThis = sendingContactId === c.id;
                  const isReplied = c.status === "REPLIED";

                  return (
                    <tr key={c.id} className="hover:bg-surface-muted transition-colors">
                      {/* Contact Name & Role */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-fg text-sm flex items-center gap-1.5">{c.name}</div>
                        <span className="text-xs text-fg-muted flex items-center gap-1 mt-0.5">
                          <User className="size-3 text-fg-subtle" />
                          {c.role}
                        </span>
                      </td>

                      {/* College Name & Hub */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-semibold text-fg truncate" title={c.collegeName}>
                          {c.collegeName}
                        </div>
                        <span className="inline-block mt-0.5 rounded-md bg-surface-muted px-1.5 py-0.5 text-xs font-mono text-fg-muted">
                          {c.collegeSlug}
                        </span>
                      </td>

                      {/* Email with copy */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[180px]">{c.email}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => copyToClipboard(c.email)}
                            title="Copy email"
                            aria-label="Copy email"
                          >
                            <Copy aria-hidden />
                          </Button>
                        </div>
                        {c.notes && (
                          <p className="text-xs text-fg-muted font-sans mt-0.5 italic truncate max-w-[180px]">
                            {c.notes}
                          </p>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {c.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning-subtle border border-warning/20 px-2.5 py-0.5 text-xs font-bold text-warning">
                            <Clock className="size-3" /> Pending
                          </span>
                        )}
                        {c.status === "SENT" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle border border-brand/20 px-2.5 py-0.5 text-xs font-bold text-brand-text">
                            <Send className="size-3" /> Sent
                          </span>
                        )}
                        {c.status === "DELIVERED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle border border-brand/20 px-2.5 py-0.5 text-xs font-bold text-brand-text">
                            <CheckCheck className="size-3" /> Delivered
                          </span>
                        )}
                        {c.status === "REPLIED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle border border-success/20 px-2.5 py-0.5 text-xs font-bold text-success">
                            <MessageSquareText className="size-3" /> Replied
                          </span>
                        )}
                        {c.lastError && (
                          <p className="text-xs text-danger mt-1 flex items-center gap-1" title={c.lastError}>
                            <AlertCircle className="size-3 shrink-0" /> Failed to send
                          </p>
                        )}
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4 text-xs text-fg-muted">
                        {c.sentAt ? (
                          <div>
                            <span className="text-fg font-medium">Sent:</span>{" "}
                            {new Date(c.sentAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        ) : (
                          <span className="italic">Not emailed</span>
                        )}
                        {c.repliedAt && (
                          <div className="text-success font-medium">
                            Replied:{" "}
                            {new Date(c.repliedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Email */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setPreviewContact(c);
                              setIsPreviewModalOpen(true);
                            }}
                            title="Preview invitation email"
                            aria-label="Preview invitation email"
                          >
                            <Eye aria-hidden />
                          </Button>

                          <Button
                            variant={c.status === "PENDING" ? "primary" : "outline"}
                            size="sm"
                            onClick={() => void handleSendSingle(c)}
                            loading={isSendingThis}
                          >
                            {!isSendingThis && <Send aria-hidden />}
                            {c.status === "PENDING" ? "Send" : "Resend"}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleToggleReplied(c)}
                            aria-pressed={isReplied}
                            aria-label={isReplied ? "Mark as not replied" : "Mark as replied"}
                            title={isReplied ? "Mark as not replied" : "Mark as replied"}
                            className={cn(isReplied && "bg-verified-subtle text-verified-text")}
                          >
                            <MessageSquareText aria-hidden />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleDelete(c.id)}
                            title="Remove contact"
                            aria-label="Remove contact"
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
      </div>

      {/* ─── Add Contact Modal ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border border-border bg-surface-raised p-6 shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-fg text-base flex items-center gap-2">
                <Plus className="size-4 text-brand-text" />
                Add a contact
              </h3>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X aria-hidden />
              </Button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label htmlFor="outreach-cli-contact-full-name" className="font-semibold text-fg">
                  Full name *
                </label>
                <input
                  id="outreach-cli-contact-full-name"
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="outreach-cli-official-student-email" className="font-semibold text-fg">
                  Email *
                </label>
                <input
                  id="outreach-cli-official-student-email"
                  type="email"
                  required
                  placeholder="e.g. rahul.sharma@iitb.ac.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="outreach-cli-college-name" className="font-semibold text-fg">
                    College *
                  </label>
                  <input
                    id="outreach-cli-college-name"
                    type="text"
                    required
                    placeholder="e.g. IIT Bombay"
                    value={newCollegeName}
                    onChange={(e) => {
                      setNewCollegeName(e.target.value);
                      if (!newCollegeSlug) {
                        setNewCollegeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                      }
                    }}
                    className={cn(fieldClassName, "w-full h-11")}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="outreach-cli-college-hub-slug" className="font-semibold text-fg">
                    College slug
                  </label>
                  <input
                    id="outreach-cli-college-hub-slug"
                    type="text"
                    placeholder="e.g. iitbombay"
                    value={newCollegeSlug}
                    onChange={(e) => setNewCollegeSlug(e.target.value)}
                    className={cn(fieldClassName, "w-full h-11")}
                  />
                </div>
              </div>

              {/* Quick college picker from indexed institutions */}
              {colleges.length > 0 && (
                <div className="space-y-1">
                  <label htmlFor="outreach-cli-or-pick-from-indexed-cam" className="text-xs text-fg-muted">
                    Or pick a college:
                  </label>
                  <select
                    id="outreach-cli-or-pick-from-indexed-cam"
                    className={cn(fieldClassName, "w-full h-11")}
                    onChange={(e) => {
                      const selected = colleges.find((col) => col.id === e.target.value);
                      if (selected) handleSelectCollege(selected);
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Pick a college
                    </option>
                    {colleges.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name} ({col.district || col.state || "India"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="outreach-cli-role-position" className="font-semibold text-fg">
                  Role
                </label>
                <input
                  id="outreach-cli-role-position"
                  type="text"
                  placeholder="e.g. General Secretary / Coding Club Head"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className={cn(fieldClassName, "w-full h-11")}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="outreach-cli-notes-context" className="font-semibold text-fg">
                  Notes
                </label>
                <textarea
                  id="outreach-cli-notes-context"
                  rows={2}
                  placeholder="e.g. Runs the coding club, asked about hackathons"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className={cn(fieldClassName, "w-full py-2 resize-none")}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className={buttonVariants({ variant: "primary", size: "sm" })}
                >
                  {isSubmittingNew ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  <span>Save Contact</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Email Preview Modal ─── */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border p-4 bg-surface-muted">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-brand-text" />
                <h3 className="font-bold text-fg text-sm">
                  Outreach Email Preview · {previewContact ? previewContact.name : "Sample Representative"}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                <X aria-hidden />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="rounded-lg border border-border bg-surface-muted p-3 space-y-1 font-mono text-xs">
                <div>
                  <span className="text-fg-muted">To:</span>{" "}
                  <span className="text-fg">
                    {previewContact
                      ? `${previewContact.name} <${previewContact.email}>`
                      : "student@college.ac.in"}
                  </span>
                </div>
                <div>
                  <span className="text-fg-muted">Subject:</span>{" "}
                  <span className="text-fg font-semibold">
                    Invitation to test run CampusLoop at{" "}
                    {previewContact ? previewContact.collegeName : "Your College"}
                  </span>
                </div>
                <div>
                  <span className="text-fg-muted">From:</span>{" "}
                  <span className="text-fg">CampusLoop Team &lt;welcome@mail.campusloop.space&gt;</span>
                </div>
              </div>

              {/* Email Body Simulation */}
              <div className="rounded-lg border border-border bg-bg p-6 space-y-4 text-fg leading-relaxed">
                <p>
                  Hi <strong>{previewContact ? previewContact.name : "Student Representative"}</strong>,
                </p>

                <p>
                  I hope you&apos;re having a productive semester! I&apos;m reaching out because of your
                  active involvement at{" "}
                  <strong>{previewContact ? previewContact.collegeName : "your university"}</strong>.
                </p>

                <p>
                  We built <strong>CampusLoop</strong> (https://campusloop.space) — a modern, verified social
                  platform made exclusively for Indian college students. Unlike open networks filled with spam
                  and outsiders, CampusLoop is gated strictly to verified college students (using official
                  college email addresses).
                </p>

                <div className="rounded-lg bg-surface-muted p-4 space-y-2">
                  <p className="font-bold text-fg">What students do on CampusLoop:</p>
                  <ul className="list-disc list-inside space-y-1 text-fg-muted">
                    <li>
                      <strong>Real Campus Feed &amp; Hubs:</strong> Live discussions, placement experiences,
                      and society updates across Indian colleges.
                    </li>
                    <li>
                      <strong>Responsible Anonymity:</strong> Honest campus confessions &amp; questions with
                      automated safety protection.
                    </li>
                    <li>
                      <strong>Free Academic Vault:</strong> Share and access past year question papers (PYQs),
                      professor notes, and semester playlists.
                    </li>
                    <li>
                      <strong>Student Match &amp; Dating:</strong> Connect with fellow verified students on
                      your campus or nearby colleges.
                    </li>
                  </ul>
                </div>

                <p>
                  Your institution&apos;s campus hub is already indexed on CampusLoop. We&apos;d love to
                  invite you to take a <strong>2-minute test run</strong> of the platform, check out your
                  college feed, and tell us what you think.
                </p>

                <div className="text-center py-2">
                  <span className="inline-block rounded-full bg-brand px-6 py-2.5 font-bold text-brand-fg shadow-xs">
                    Test Run CampusLoop &rarr;
                  </span>
                </div>

                <p className="text-fg-muted">
                  If you find it interesting and would like to help lead early campus activities, or if your
                  student society would like to partner with us, simply reply directly to this email — I
                  personally read and respond to every note.
                </p>

                <div className="pt-2 text-fg-muted border-t border-border">
                  <p className="font-bold text-fg">The CampusLoop Team</p>
                  <p className="text-xs">New Delhi · Bengaluru</p>
                  <p className="text-xs text-brand-text">campusloop.space · Instagram @campusloop.space</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border p-4 bg-surface-muted flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                Close preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
