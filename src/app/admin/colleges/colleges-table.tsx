"use client";

import { ChevronLeft, ChevronRight, Edit3, Globe, PlusIcon, School, Search, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fieldClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addDomain, deleteCollege, removeDomain } from "./actions";
import { type CollegeEditData, EditCollegeModal } from "./edit-college-modal";

interface CollegeRow {
  id: string;
  name: string;
  slug: string;
  district: string | null;
  state: string | null;
  country: string;
  website?: string | null;
  yearOfEstablishment?: number | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  nirfRank?: number | null;
  description?: string | null;
  domains?: { id: string; domain: string }[];
}

export function CollegesTable({ initialColleges }: { initialColleges: CollegeRow[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [activeInstId, setActiveInstId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCollege, setEditingCollege] = useState<CollegeEditData | null>(null);
  const [deleteCollegeData, setDeleteCollegeData] = useState<{ id: string; name: string } | null>(null);
  const [removeDomainId, setRemoveDomainId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  const filteredColleges = useMemo(() => {
    if (!searchQuery.trim()) return initialColleges;
    const q = searchQuery.toLowerCase();
    return initialColleges.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q) ||
        c.district?.toLowerCase().includes(q)
    );
  }, [initialColleges, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredColleges.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedColleges = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredColleges.slice(start, start + PAGE_SIZE);
  }, [filteredColleges, validCurrentPage]);

  async function confirmDeleteCollege() {
    if (!deleteCollegeData) return;
    setIsLoading(true);
    try {
      await deleteCollege(deleteCollegeData.id);
      toast.success("College deleted");
      setDeleteCollegeData(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete college");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddDomain(institutionId: string) {
    if (!newDomain.trim()) return;
    setIsLoading(true);
    try {
      await addDomain(institutionId, newDomain.trim().toLowerCase());
      toast.success(`Added @${newDomain}`);
      setNewDomain("");
      setActiveInstId(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add domain");
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmRemoveDomain() {
    if (!removeDomainId) return;
    setIsLoading(true);
    try {
      await removeDomain(removeDomainId);
      toast.success("Domain removed");
      setRemoveDomainId(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove domain");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted" />
        <input
          aria-label="Search colleges"
          type="text"
          placeholder="Search by name, slug, state or district"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(fieldClassName, "w-full pl-10 pr-4 h-11")}
        />
      </div>

      <div className="w-full overflow-x-auto border border-border rounded-lg bg-surface">
        <table className="w-full min-w-[680px] text-left text-sm text-fg-muted">
          <thead className="bg-surface-muted text-xs font-bold text-fg border-b border-border">
            <tr>
              <th className="px-6 py-3.5">College</th>
              <th className="px-6 py-3.5">Location</th>
              <th className="px-6 py-3.5">Email domains</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedColleges.map((college) => (
              <tr key={college.id} className="hover:bg-surface-muted transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    {/* Logo Thumbnail */}
                    <div className="size-10 rounded-lg bg-surface border border-border  p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {college.logoUrl ? (
                        <img
                          src={college.logoUrl}
                          alt={college.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <School className="size-5 text-fg-subtle" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-fg">{college.name}</span>
                        {college.bannerUrl && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-brand-subtle text-brand-text border border-brand-subtle-border">
                            Banner
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-fg-muted flex items-center gap-2">
                        <span>
                          slug: <code className="text-fg">{college.slug}</code>
                        </span>
                        {college.website && (
                          <a
                            href={
                              college.website.startsWith("http")
                                ? college.website
                                : `https://${college.website}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${college.name} website`}
                            className="flex items-center gap-0.5 hover:text-brand-text"
                          >
                            <Globe className="size-3" aria-hidden />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-3.5 text-xs">
                  <div>
                    <span className="font-medium text-fg">
                      {college.district ? `${college.district}, ` : ""}
                      {college.state || college.country}
                    </span>
                    {college.nirfRank && (
                      <span className="block text-xs text-warning font-bold">NIRF #{college.nirfRank}</span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-3.5">
                  <div className="flex flex-wrap gap-1.5">
                    {college.domains?.map((d) => (
                      <span
                        key={d.id}
                        className="flex items-center gap-1 rounded-lg bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg border border-border"
                      >
                        @{d.domain}
                        <button
                          onClick={() => setRemoveDomainId(d.id)}
                          className="hover:text-danger ml-0.5 cursor-pointer"
                          disabled={isLoading}
                        >
                          &times;
                        </button>
                      </span>
                    ))}

                    {activeInstId === college.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          aria-label="New email domain"
                          type="text"
                          placeholder="e.g. bitmesra.ac.in"
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          className={cn(fieldClassName, "h-11")}
                        />
                        <button
                          onClick={() => handleAddDomain(college.id)}
                          disabled={isLoading}
                          className="text-xs font-bold text-brand-text cursor-pointer hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setActiveInstId(null)}
                          className="text-xs text-fg-muted cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveInstId(college.id)}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        <PlusIcon className="h-3 w-3" /> Add Domain
                      </button>
                    )}
                  </div>
                </td>

                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingCollege(college)}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      title="Edit college"
                    >
                      <Edit3 className="size-3 text-brand-text" />
                      <span>Edit Media</span>
                    </button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteCollegeData({ id: college.id, name: college.name })}
                      disabled={isLoading}
                      title="Delete college"
                      aria-label="Delete college"
                      className="hover:bg-danger-subtle hover:text-danger"
                    >
                      <Trash2Icon aria-hidden />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredColleges.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-xs text-fg-muted">
                  No colleges match. Try another search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredColleges.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1 text-xs text-fg-muted">
          <div>
            Showing <span className="font-bold text-fg">{(validCurrentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
            <span className="font-bold text-fg">
              {Math.min(validCurrentPage * PAGE_SIZE, filteredColleges.length)}
            </span>{" "}
            of <span className="font-bold text-fg">{filteredColleges.length}</span> colleges
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ChevronLeft className="size-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-2 font-bold text-fg">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Edit College Media & Details Modal */}
      {editingCollege && (
        <EditCollegeModal
          college={editingCollege}
          onClose={() => setEditingCollege(null)}
          onSaved={() => {
            router.refresh();
          }}
        />
      )}

      {/* Delete College Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteCollegeData)}
        title="Delete this college?"
        description={`Are you sure you want to delete ${deleteCollegeData?.name || "this college"}? This will permanently delete all associated student accounts, posts, and domains.`}
        confirmText="Delete college"
        variant="danger"
        isLoading={isLoading}
        onClose={() => setDeleteCollegeData(null)}
        onConfirm={confirmDeleteCollege}
      />

      {/* Remove domain Modal */}
      <ConfirmDialog
        isOpen={Boolean(removeDomainId)}
        title="Remove this email domain?"
        description="Students with this email domain won't be able to sign up for this college anymore."
        confirmText="Remove domain"
        variant="warning"
        isLoading={isLoading}
        onClose={() => setRemoveDomainId(null)}
        onConfirm={confirmRemoveDomain}
      />
    </div>
  );
}
