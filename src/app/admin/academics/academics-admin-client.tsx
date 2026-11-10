"use client";

import { BookOpen, CheckCircle2, ExternalLink, FileText, Search, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fieldClassName } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { AdminStatStrip } from "../_components/admin-stat-strip";

export interface AcademicResourceItem {
  id: string;
  title: string;
  description: string | null;
  subjectCode: string;
  subjectName: string;
  branch: string;
  semester: number;
  resourceType: string;
  fileUrl: string | null;
  driveUrl: string | null;
  downloadsCount: number;
  upvotesCount: number;
  isVerified: boolean;
  createdAt: string | Date | null;
  institutionName?: string | null;
  uploaderName?: string | null;
}

interface AcademicsAdminClientProps {
  initialResources: AcademicResourceItem[];
}

export function AcademicsAdminClient({ initialResources }: AcademicsAdminClientProps) {
  const [resources, setResources] = useState<AcademicResourceItem[]>(initialResources);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "VERIFIED">("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredResources = resources.filter((res) => {
    if (filter === "PENDING" && res.isVerified) return false;
    if (filter === "VERIFIED" && !res.isVerified) return false;
    if (!search.trim()) return true;

    const q = search.toLowerCase();
    return (
      res.title.toLowerCase().includes(q) ||
      res.subjectCode.toLowerCase().includes(q) ||
      res.subjectName.toLowerCase().includes(q) ||
      res.branch.toLowerCase().includes(q) ||
      (res.institutionName && res.institutionName.toLowerCase().includes(q))
    );
  });

  const totalCount = resources.length;
  const verifiedCount = resources.filter((r) => r.isVerified).length;
  const pendingCount = totalCount - verifiedCount;
  const totalDownloads = resources.reduce((acc, r) => acc + (r.downloadsCount || 0), 0);

  async function handleToggleVerify(id: string, currentStatus: boolean) {
    sounds.pop();
    haptics.medium();
    setProcessingId(id);
    const nextStatus = !currentStatus;

    try {
      const res = await fetch("/api/admin/academics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_verify",
          resourceId: id,
          isVerified: nextStatus,
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to update verification status");

      setResources((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isVerified: nextStatus } : item))
      );
      toast.success(nextStatus ? "Marked as verified" : "Verified badge removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this resource?")) return;

    sounds.tap();
    haptics.heavy();
    setProcessingId(id);

    try {
      const res = await fetch("/api/admin/academics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          resourceId: id,
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      setResources((prev) => prev.filter((item) => item.id !== id));
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminStatStrip
        items={[
          { label: "Uploads", value: totalCount },
          { label: "Waiting for review", value: pendingCount },
          { label: "Marked official", value: verifiedCount },
          { label: "Downloads", value: totalDownloads },
        ]}
      />

      {/* ─── Controls & Search ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-lg shrink-0">
          {(["ALL", "PENDING", "VERIFIED"] as const).map((tab) => (
            <Chip
              size="sm"
              selected={filter === tab}
              key={tab}
              onClick={() => {
                sounds.tap();
                haptics.light();
                setFilter(tab);
              }}
            >
              {tab === "ALL"
                ? `All (${totalCount})`
                : tab === "PENDING"
                  ? `Pending (${pendingCount})`
                  : `Verified (${verifiedCount})`}
            </Chip>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-muted" />
          <input
            aria-label="Search resources"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, subject code or branch"
            className={cn(fieldClassName, "w-full pl-9 pr-4 h-11")}
          />
        </div>
      </div>

      {/* ─── Resources List ─── */}
      {filteredResources.length === 0 ? (
        <div className="py-16 text-center rounded-lg border border-dashed border-border bg-surface space-y-2">
          <BookOpen className="h-8 w-8 text-fg-subtle mx-auto" />
          <p className="text-sm font-bold text-fg">No study material matches</p>
          <p className="text-xs text-fg-muted">
            {search ? "Try clearing your search query" : "No study materials in this tab"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="p-4 rounded-lg bg-surface border border-border flex flex-col justify-between gap-3 hover:border-border transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-subtle text-brand-text">
                        {res.resourceType}
                      </span>
                      <span className="text-xs font-bold text-fg-muted">
                        {res.subjectCode} · Sem {res.semester}
                      </span>
                      {res.isVerified ? (
                        <span className="text-xs font-bold text-success bg-success-subtle px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Official
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-warning bg-warning-subtle px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-fg leading-snug truncate">{res.title}</h4>
                    <p className="text-xs text-fg-muted">{res.subjectName}</p>
                  </div>
                </div>

                {res.description && <p className="text-xs text-fg-muted line-clamp-2">{res.description}</p>}

                <div className="flex items-center gap-3 text-xs text-fg-muted pt-1">
                  <span>{res.branch}</span>
                  <span>·</span>
                  <span>{res.institutionName || "CampusLoop"}</span>
                  <span>·</span>
                  <span>{res.downloadsCount || 0} downloads</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  {res.fileUrl && (
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-brand-text hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Direct PDF</span>
                    </a>
                  )}
                  {res.driveUrl && (
                    <a
                      href={res.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-brand-text hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Drive Link</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={res.isVerified ? "outline" : "primary"}
                    size="sm"
                    loading={processingId === res.id}
                    onClick={() => handleToggleVerify(res.id, res.isVerified)}
                  >
                    {res.isVerified ? <XCircle aria-hidden /> : <CheckCircle2 aria-hidden />}
                    {res.isVerified ? "Remove verified" : "Verify"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={processingId === res.id}
                    onClick={() => handleDelete(res.id)}
                    title="Delete"
                    aria-label="Delete"
                    className="hover:bg-danger-subtle hover:text-danger"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
