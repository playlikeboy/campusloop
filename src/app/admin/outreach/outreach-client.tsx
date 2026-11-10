"use client";

import {
  AlertCircle,
  Building2,
  Check,
  CheckCheck,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Filter,
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

export function OutreachClient({
  initialContacts,
  initialMetrics,
  colleges,
}: OutreachClientProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "SENT" | "REPLIED">("ALL");
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [sendingContactId, setSendingContactId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
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
        toast.success("Outreach list refreshed");
      }
    } catch {
      toast.error("Failed to refresh outreach data");
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
        toast.success(`Invitation dispatched to ${contact.name}`);
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
      toast.error("Network error while sending email");
    } finally {
      setSendingContactId(null);
    }
  }

  async function handleSendAllPending() {
    if (metrics.pending === 0) {
      toast.info("No pending contacts to invite");
      return;
    }

    const confirmSend = window.confirm(
      `Are you sure you want to send invitations to all ${metrics.pending} pending campus contacts?`
    );
    if (!confirmSend) return;

    setIsSendingAll(true);
    toast.loading("Sending outreach emails in batches...", { id: "outreach-send-all" });

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
        toast.success(
          `Successfully dispatched ${data.successCount ?? 0} invitations (${data.failCount ?? 0} failed)`,
          { id: "outreach-send-all" }
        );
        await refreshData();
      } else {
        toast.error(data.error || "Batch sending failed", { id: "outreach-send-all" });
      }
    } catch {
      toast.error("Network error during batch sending", { id: "outreach-send-all" });
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
        toast.success(isCurrentlyReplied ? "Marked as unreplied" : "Marked as replied!");
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
      toast.error("Failed to update status");
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
      toast.error("Failed to delete contact");
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newCollegeName.trim()) {
      toast.error("Name, Email, and College Name are required");
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
        toast.success("New contact added to outreach registry!");
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
      toast.error("Network error while adding contact");
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
        <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Users className="size-4 text-brand-text" />
            Total Leads
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{metrics.total}</p>
          <span className="text-[11px] text-muted-foreground">Indexed campus contacts</span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Clock className="size-4 text-warning" />
            Pending Outreach
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-warning">
            {metrics.pending}
          </p>
          <span className="text-[11px] text-muted-foreground">Ready to email</span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Send className="size-4 text-primary" />
            Dispatched
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{metrics.sent}</p>
          <span className="text-[11px] text-muted-foreground">Emails sent</span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CheckCheck className="size-4 text-brand-text" />
            Delivered
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{metrics.delivered}</p>
          <span className="text-[11px] text-muted-foreground">Inbox delivery confirmed</span>
        </div>

        <div className="col-span-2 rounded-2xl border border-border/60 bg-surface p-4 shadow-2xs sm:col-span-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <MessageSquareText className="size-4 text-success" />
            Replied ({metrics.replyRate}%)
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-success">
            {metrics.replied}
          </p>
          <span className="text-[11px] text-muted-foreground">Responses received</span>
        </div>
      </div>

      {/* ─── Controls & Actions Bar ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl border border-border/50 bg-muted/40 p-1">
            {(["ALL", "PENDING", "SENT", "REPLIED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                  statusFilter === tab
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "ALL" && `All (${metrics.total})`}
                {tab === "PENDING" && `Pending (${metrics.pending})`}
                {tab === "SENT" && `Sent (${metrics.sent})`}
                {tab === "REPLIED" && `Replied (${metrics.replied})`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void refreshData()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh registry"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 sm:w-64 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, email, college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-surface pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={() => void handleSendAllPending()}
            disabled={isSendingAll || metrics.pending === 0}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSendingAll ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            <span>Send All Pending ({metrics.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* ─── Contacts Table ─── */}
      <div className="rounded-2xl border border-border/60 bg-surface shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-[11px] font-semibold text-muted-foreground">
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">College & Hub</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Mail className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                    <p className="font-semibold text-foreground text-sm">No contacts match your criteria</p>
                    <p className="text-xs mt-1">Try adjusting the filter tabs or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => {
                  const isSendingThis = sendingContactId === c.id;
                  const isReplied = c.status === "REPLIED";

                  return (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      {/* Contact Name & Role */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          {c.name}
                        </div>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="size-3 text-muted-foreground/70" />
                          {c.role}
                        </span>
                      </td>

                      {/* College Name & Hub */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-semibold text-foreground truncate" title={c.collegeName}>
                          {c.collegeName}
                        </div>
                        <span className="inline-block mt-0.5 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {c.collegeSlug}
                        </span>
                      </td>

                      {/* Email with copy */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[180px]">{c.email}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.email)}
                            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Copy email"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                        {c.notes && (
                          <p className="text-[10px] text-muted-foreground font-sans mt-0.5 italic truncate max-w-[180px]">
                            {c.notes}
                          </p>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {c.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning-subtle border border-warning/20 px-2.5 py-0.5 text-[11px] font-bold text-warning">
                            <Clock className="size-3" /> Pending
                          </span>
                        )}
                        {c.status === "SENT" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle border border-brand/20 px-2.5 py-0.5 text-[11px] font-bold text-brand-text">
                            <Send className="size-3" /> Sent
                          </span>
                        )}
                        {c.status === "DELIVERED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle border border-brand/20 px-2.5 py-0.5 text-[11px] font-bold text-brand-text">
                            <CheckCheck className="size-3" /> Delivered
                          </span>
                        )}
                        {c.status === "REPLIED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle border border-success/20 px-2.5 py-0.5 text-[11px] font-bold text-success">
                            <MessageSquareText className="size-3" /> Replied
                          </span>
                        )}
                        {c.lastError && (
                          <p className="text-[10px] text-destructive mt-1 flex items-center gap-1" title={c.lastError}>
                            <AlertCircle className="size-3 shrink-0" /> Failed to send
                          </p>
                        )}
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4 text-[11px] text-muted-foreground">
                        {c.sentAt ? (
                          <div>
                            <span className="text-foreground font-medium">Sent:</span>{" "}
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
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewContact(c);
                              setIsPreviewModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            title="Preview invitation email"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          {/* Send Single */}
                          <button
                            type="button"
                            onClick={() => void handleSendSingle(c)}
                            disabled={isSendingThis}
                            className={cn(
                              "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer",
                              c.status === "PENDING"
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "border border-border/80 bg-muted/40 text-muted-foreground hover:text-foreground"
                            )}
                            title={c.status === "PENDING" ? "Send Invitation" : "Resend Invitation"}
                          >
                            {isSendingThis ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Send className="size-3" />
                            )}
                            <span>{c.status === "PENDING" ? "Send" : "Resend"}</span>
                          </button>

                          {/* Mark Replied */}
                          <button
                            type="button"
                            onClick={() => void handleToggleReplied(c)}
                            className={cn(
                              "rounded-lg p-1.5 transition-colors cursor-pointer",
                              isReplied
                                ? "bg-success-subtle text-success"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                            title={isReplied ? "Mark as unreplied" : "Mark as replied"}
                          >
                            <MessageSquareText className="size-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => void handleDelete(c.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                            title="Remove contact"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                Add Campus Outreach Contact
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Contact Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Official / Student Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.sharma@iitb.ac.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">College Name *</label>
                  <input
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
                    className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">College Hub Slug</label>
                  <input
                    type="text"
                    placeholder="e.g. iitbombay"
                    value={newCollegeSlug}
                    onChange={(e) => setNewCollegeSlug(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick college picker from indexed institutions */}
              {colleges.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Or pick from indexed campuses:</label>
                  <select
                    className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    onChange={(e) => {
                      const selected = colleges.find((col) => col.id === e.target.value);
                      if (selected) handleSelectCollege(selected);
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select an indexed college...
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
                <label className="font-semibold text-foreground">Role / Position</label>
                <input
                  type="text"
                  placeholder="e.g. General Secretary / Coding Club Head"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Notes / Context</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Found on public tech club registry, interested in hackathon sponsorships."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-foreground focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-border/60 bg-muted/30 px-4 py-2 font-semibold text-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {isSubmittingNew ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  <span>Save Contact</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Email Preview Modal ─── */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-border/70 bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/40 p-4 bg-muted/20">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">
                  Outreach Email Preview · {previewContact ? previewContact.name : "Sample Representative"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1 font-mono text-[11px]">
                <div>
                  <span className="text-muted-foreground">To:</span>{" "}
                  <span className="text-foreground">
                    {previewContact ? `${previewContact.name} <${previewContact.email}>` : "student@college.ac.in"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Subject:</span>{" "}
                  <span className="text-foreground font-semibold">
                    Invitation to test run CampusLoop at {previewContact ? previewContact.collegeName : "Your College"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">From:</span>{" "}
                  <span className="text-foreground">CampusLoop Team &lt;welcome@mail.campusloop.space&gt;</span>
                </div>
              </div>

              {/* Email Body Simulation */}
              <div className="rounded-2xl border border-border/70 bg-background p-6 space-y-4 text-foreground leading-relaxed">
                <p>Hi <strong>{previewContact ? previewContact.name : "Student Representative"}</strong>,</p>

                <p>
                  I hope you&apos;re having a productive semester! I&apos;m reaching out because of your active involvement at{" "}
                  <strong>{previewContact ? previewContact.collegeName : "your university"}</strong>.
                </p>

                <p>
                  We built <strong>CampusLoop</strong> (https://campusloop.space) — a modern, verified social platform made exclusively for Indian college students. Unlike open networks filled with spam and outsiders, CampusLoop is gated strictly to verified college students (using official college email addresses).
                </p>

                <div className="rounded-xl bg-muted/40 p-4 space-y-2">
                  <p className="font-bold text-foreground">What students do on CampusLoop:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Real Campus Feed &amp; Hubs:</strong> Live discussions, placement experiences, and society updates across 1,350+ indexed Indian colleges.</li>
                    <li><strong>Responsible Anonymity:</strong> Honest campus confessions &amp; questions with automated safety protection.</li>
                    <li><strong>Free Academic Vault:</strong> Share and access past year question papers (PYQs), professor notes, and semester playlists.</li>
                    <li><strong>Student Match &amp; Dating:</strong> Connect with fellow verified students on your campus or nearby colleges.</li>
                  </ul>
                </div>

                <p>
                  Your institution&apos;s campus hub is already indexed on CampusLoop. We&apos;d love to invite you to take a <strong>2-minute test run</strong> of the platform, check out your college feed, and share your unfiltered thoughts.
                </p>

                <div className="text-center py-2">
                  <span className="inline-block rounded-full bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-xs">
                    Test Run CampusLoop &rarr;
                  </span>
                </div>

                <p className="text-muted-foreground">
                  If you find it interesting and would like to help lead early campus activities, or if your student society would like to partner with us, simply reply directly to this email — I personally read and respond to every note.
                </p>

                <div className="pt-2 text-muted-foreground border-t border-border/30">
                  <p className="font-bold text-foreground">The CampusLoop Team</p>
                  <p className="text-[11px]">New Delhi · Bengaluru</p>
                  <p className="text-[11px] text-primary">campusloop.space · Instagram @campusloop.space</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 p-4 bg-muted/20 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="rounded-xl bg-foreground text-background px-4 py-2 text-xs font-bold hover:opacity-90 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
