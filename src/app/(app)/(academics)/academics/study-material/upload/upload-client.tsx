"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  FileCode,
  FileCode2,
  FileQuestion,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  FolderOpen,
  Globe,
  Layers,
  Link2,
  Loader2,
  Package,
  PartyPopper,
  Plus,
  Presentation,
  Rocket,
  Share2,
  ShieldCheck,
  Tag,
  Trash2,
  UploadCloud,
  Video,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { type ComboboxOption, SearchableCombobox } from "@/components/ui/searchable-combobox";
import { getYoutubeEmbedInfo, isYoutubeUrl } from "@/lib/academics/youtube";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadMediaFile } from "@/lib/upload";
import { cn } from "@/lib/utils";

export type AttachmentType =
  | "PDF"
  | "PPT"
  | "DOCX"
  | "IMAGE"
  | "DRIVE"
  | "LINK"
  | "VIDEO"
  | "HTML"
  | "CODE"
  | "OTHER";

export interface UploadAttachmentItem {
  id: string;
  title: string;
  url: string;
  type: AttachmentType;
  sizeBytes?: number;
  fileName?: string;
  status: "ready" | "uploading" | "error";
  uploadProgress?: number;
  error?: string;
  /** Shown under the video in the Udemy-style course player. */
  notes?: string;
  previewImage?: string;
  previewSiteName?: string;
}

export interface UploadModuleItem {
  id: string;
  title: string;
  description: string;
  attachments: UploadAttachmentItem[];
}

interface LinkDraft {
  isOpen: boolean;
  url: string;
  title: string;
  isFetchingPreview: boolean;
}

const RESOURCE_TYPES = [
  {
    id: "NOTES",
    label: "Lecture Notes",
    desc: "Class notes, slides or handwritten notes",
    icon: BookOpen,
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  },
  {
    id: "PYQ",
    label: "PYQs & Solutions",
    desc: "Past midsem and endsem papers, with answers if you have them",
    icon: FileQuestion,
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  },
  {
    id: "CHEAT_SHEET",
    label: "Formula Cheat Sheet",
    desc: "Short revision sheets with formulas and key ideas",
    icon: Zap,
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  },
  {
    id: "LAB_MANUAL",
    label: "Lab Manual & Code",
    desc: "Experiments, diagrams, viva questions and code",
    icon: FlaskConical,
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  },
  {
    id: "MODULE",
    label: "Unit / Module Pack",
    desc: "Notes for one unit or chapter",
    icon: Layers,
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  },
  {
    id: "BOOK",
    label: "Reference Solutions",
    desc: "Solutions to textbook problems",
    icon: Bookmark,
    badgeColor: "bg-brand-subtle text-brand-text border-brand-subtle-border",
  },
] as const;

const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Chemical Engineering",
  "Data Science & AI",
  "Basic Sciences",
  "All Branches",
];

const BRANCH_OPTIONS: ComboboxOption[] = BRANCHES.map((b) => ({
  value: b,
  label: b,
}));

const SEMESTER_OPTIONS: ComboboxOption[] = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
  value: String(s),
  label: `Semester ${s}`,
}));

const COMMON_TAG_SUGGESTIONS = [
  "Endsem2024",
  "MidsemExam",
  "StepByStep",
  "TopperNotes",
  "FormulaSheet",
  "SolvedNumericals",
  "ImportantQuestions",
  "UnitWise",
];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptyModule(): UploadModuleItem {
  return { id: generateId("module"), title: "", description: "", attachments: [] };
}

function inferAttachmentType(filenameOrUrl: string): AttachmentType {
  const lower = filenameOrUrl.toLowerCase();
  if (lower.includes("drive.google.com")) return "DRIVE";
  if (isYoutubeUrl(lower)) return "VIDEO";
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return "PPT";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "DOCX";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "HTML";
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp"))
    return "IMAGE";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) return "OTHER";
  if (
    lower.endsWith(".py") ||
    lower.endsWith(".cpp") ||
    lower.endsWith(".c") ||
    lower.endsWith(".java") ||
    lower.endsWith(".js") ||
    lower.endsWith(".ts")
  )
    return "CODE";
  if (lower.startsWith("http://") || lower.startsWith("https://")) return "LINK";
  return "OTHER";
}

function getAttachmentIcon(type: string) {
  switch (type) {
    case "PDF":
      return FileText;
    case "PPT":
      return Presentation;
    case "DOCX":
      return FileText;
    case "IMAGE":
      return FileSpreadsheet;
    case "DRIVE":
      return FolderOpen;
    case "VIDEO":
      return Video;
    case "HTML":
      return FileCode2;
    case "CODE":
      return FileCode;
    default:
      return Globe;
  }
}

async function fetchLinkPreview(
  url: string
): Promise<{ title?: string; image?: string; siteName?: string } | null> {
  try {
    const res = await fetch(`/api/embed/preview?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; image?: string; siteName?: string; error?: string };
    if (data.error) return null;
    return { title: data.title, image: data.image, siteName: data.siteName };
  } catch {
    return null;
  }
}

export function UploadAcademicClient() {
  const router = useRouter();

  // Core fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Materials, module-based (progressive disclosure — most uploads never need a 2nd module)
  const [modules, setModules] = useState<UploadModuleItem[]>([createEmptyModule()]);
  const [linkDrafts, setLinkDrafts] = useState<Record<string, LinkDraft>>({});

  // Advanced (optional) fields
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [resourceType, setResourceType] = useState<string>("NOTES");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [branch, setBranch] = useState("Computer Science");
  const [semester, setSemester] = useState<number>(3);
  const [moduleOrChapter, setModuleOrChapter] = useState("");
  const [tags, setTags] = useState<string[]>(["Endsem2024"]);
  const [tagInput, setTagInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [published, setPublished] = useState<{ id: string; title: string; points?: number } | null>(null);

  function getLinkDraft(moduleId: string): LinkDraft {
    return linkDrafts[moduleId] || { isOpen: false, url: "", title: "", isFetchingPreview: false };
  }
  function setLinkDraft(moduleId: string, patch: Partial<LinkDraft>) {
    setLinkDrafts((prev) => ({ ...prev, [moduleId]: { ...getLinkDraft(moduleId), ...patch } }));
  }

  function updateModule(moduleId: string, patch: Partial<UploadModuleItem>) {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, ...patch } : m)));
  }

  function addModule() {
    sounds.tap();
    haptics.light();
    setModules((prev) => [...prev, createEmptyModule()]);
  }

  function removeModule(moduleId: string) {
    sounds.tap();
    haptics.light();
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
  }

  function moveModule(moduleId: string, dir: "up" | "down") {
    setModules((prev) => {
      const idx = prev.findIndex((m) => m.id === moduleId);
      const targetIdx = dir === "up" ? idx - 1 : idx + 1;
      if (idx < 0 || targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
      return copy;
    });
    sounds.tap();
    haptics.light();
  }

  function setModuleAttachments(
    moduleId: string,
    updater: (atts: UploadAttachmentItem[]) => UploadAttachmentItem[]
  ) {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, attachments: updater(m.attachments) } : m))
    );
  }

  // Handle direct multiple files upload into a specific module
  async function handleFilesUpload(moduleId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    sounds.tap();
    haptics.medium();

    for (const file of files) {
      const inferredType = inferAttachmentType(file.name);
      const isHtml = inferredType === "HTML";
      const sizeLimitBytes = isHtml ? 3 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > sizeLimitBytes) {
        toast.error(`"${file.name}" is too big. Max size is ${isHtml ? "3 MB" : "50 MB"}.`);
        continue;
      }

      const tempId = generateId("file");
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      setModuleAttachments(moduleId, (atts) => [
        ...atts,
        {
          id: tempId,
          title: cleanName,
          url: "",
          type: inferredType,
          fileName: file.name,
          sizeBytes: file.size,
          status: "uploading",
          uploadProgress: 0,
        },
      ]);

      if (!title.trim()) {
        setTitle(cleanName);
      }

      uploadMediaFile(file, isHtml ? "academic_html" : "document", file.name, (progress) => {
        setModuleAttachments(moduleId, (atts) =>
          atts.map((item) => (item.id === tempId ? { ...item, uploadProgress: progress.percent } : item))
        );
      })
        .then((res) => {
          if (res?.url) {
            setModuleAttachments(moduleId, (atts) =>
              atts.map((item) =>
                item.id === tempId ? { ...item, url: res.url, status: "ready", uploadProgress: 100 } : item
              )
            );
            toast.success(`Uploaded "${file.name}"`);
          } else {
            setModuleAttachments(moduleId, (atts) =>
              atts.map((item) =>
                item.id === tempId ? { ...item, status: "error", error: "Upload failed" } : item
              )
            );
            toast.error(`Couldn't upload "${file.name}". Try again.`);
          }
        })
        .catch((err) => {
          setModuleAttachments(moduleId, (atts) =>
            atts.map((item) =>
              item.id === tempId
                ? { ...item, status: "error", error: err instanceof Error ? err.message : "Error" }
                : item
            )
          );
          toast.error(`Couldn't upload "${file.name}". Check your connection and try again.`);
        });
    }

    e.target.value = "";
  }

  // Add external link / Google Drive / YouTube, with automatic preview
  async function handleAddExternalLink(moduleId: string) {
    const draft = getLinkDraft(moduleId);
    const raw = draft.url.trim();
    if (!raw) {
      toast.error("Paste a link first.");
      return;
    }
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      toast.error("Links must start with https:// or http://");
      return;
    }

    sounds.tap();
    haptics.light();

    const inferredType = inferAttachmentType(raw);
    const defaultTitle =
      inferredType === "DRIVE"
        ? "Google Drive Folder / Document"
        : inferredType === "VIDEO"
          ? "YouTube Lecture / Playlist"
          : "External Study Resource";

    const attId = generateId("link");
    const newAtt: UploadAttachmentItem = {
      id: attId,
      title: draft.title.trim() || defaultTitle,
      url: raw,
      type: inferredType,
      status: "ready",
    };

    setModuleAttachments(moduleId, (atts) => [...atts, newAtt]);
    setLinkDraft(moduleId, { isOpen: false, url: "", title: "" });
    toast.success("Link added");

    // Creative feature: automatically fetch a preview for the pasted link.
    if (inferredType === "VIDEO") {
      const yt = getYoutubeEmbedInfo(raw);
      if (yt.thumbnailUrl) {
        setModuleAttachments(moduleId, (atts) =>
          atts.map((a) => (a.id === attId ? { ...a, previewImage: yt.thumbnailUrl || undefined } : a))
        );
      }
      return;
    }

    setLinkDraft(moduleId, { isFetchingPreview: true });
    const preview = await fetchLinkPreview(raw);
    setLinkDraft(moduleId, { isFetchingPreview: false });
    if (preview) {
      setModuleAttachments(moduleId, (atts) =>
        atts.map((a) =>
          a.id === attId
            ? {
                ...a,
                title: a.title === defaultTitle && preview.title ? preview.title : a.title,
                previewImage: preview.image,
                previewSiteName: preview.siteName,
              }
            : a
        )
      );
    }
  }

  function moveAttachment(moduleId: string, idx: number, dir: "up" | "down") {
    sounds.tap();
    haptics.light();
    setModuleAttachments(moduleId, (atts) => {
      const targetIdx = dir === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= atts.length) return atts;
      const copy = [...atts];
      [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
      return copy;
    });
  }

  function removeAttachment(moduleId: string, attId: string) {
    sounds.tap();
    haptics.light();
    setModuleAttachments(moduleId, (atts) => atts.filter((a) => a.id !== attId));
  }

  function updateAttachmentField(moduleId: string, attId: string, patch: Partial<UploadAttachmentItem>) {
    setModuleAttachments(moduleId, (atts) => atts.map((a) => (a.id === attId ? { ...a, ...patch } : a)));
  }

  function handleAddTag(tagText: string) {
    const clean = tagText.trim().replace(/^#/, "");
    if (!clean) return;
    if (tags.includes(clean)) {
      setTagInput("");
      return;
    }
    sounds.tap();
    haptics.light();
    setTags((prev) => [...prev, clean]);
    setTagInput("");
  }

  function handleRemoveTag(tagToRemove: string) {
    sounds.tap();
    haptics.light();
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }

  function handleGenerateTitle() {
    if (!subjectCode.trim() && !subjectName.trim()) {
      toast.info("Add a subject code or name in More details first, then try again.");
      return;
    }
    sounds.tap();
    haptics.light();
    const typeObj = RESOURCE_TYPES.find((r) => r.id === resourceType);
    const typeLabel = typeObj ? typeObj.label : "Notes";
    const sub = subjectCode.trim() || subjectName.trim();
    const semStr = `Semester ${semester}`;
    const generated = `${sub} ${typeLabel} - ${semStr} ${branch} (${moduleOrChapter ? `Unit ${moduleOrChapter}` : "Complete Syllabus"})`;
    setTitle(generated);
  }

  // Aggregate attachment stats across all modules
  const allAttachments = modules.flatMap((m) => m.attachments);
  const readyAttachmentsCount = allAttachments.filter((a) => a.status === "ready" && a.url).length;
  const hasUploading = allAttachments.some((a) => a.status === "uploading");
  const hasTitle = title.trim().length > 0;
  const isFormValid = hasTitle && readyAttachmentsCount > 0 && !hasUploading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Add a title first.");
      return;
    }
    if (hasUploading) {
      toast.info("Wait for your files to finish uploading.");
      return;
    }
    if (readyAttachmentsCount === 0) {
      toast.error("Add at least one file or link first.");
      return;
    }

    setIsSubmitting(true);
    sounds.send();
    haptics.medium();

    const modulesPayload = modules
      .map((m, order) => ({
        id: m.id,
        title: m.title.trim() || undefined,
        description: m.description.trim() || undefined,
        order,
        attachments: m.attachments
          .filter((a) => a.status === "ready" && a.url)
          .map((a) => ({
            id: a.id,
            title: a.title,
            url: a.url,
            type: a.type,
            sizeBytes: a.sizeBytes,
            description: a.notes?.trim() || undefined,
            previewImage: a.previewImage,
            previewSiteName: a.previewSiteName,
          })),
      }))
      .filter((m) => m.attachments.length > 0);

    try {
      const res = await fetch("/api/academics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          subjectCode: subjectCode.trim() || undefined,
          subjectName: subjectName.trim() || undefined,
          branch,
          semester,
          resourceType,
          moduleOrChapter: moduleOrChapter.trim() || null,
          modules: modulesPayload,
          tags,
        }),
      });

      const json = (await res.json()) as any;
      if (res.ok && json.success) {
        sounds.pop();
        haptics.success();
        setPublished({ id: json.item?.id, title: title.trim(), points: json.item?.uploader?.points });

        // Lightweight milestone toast derived from the (already-existing) points total — no new schema.
        const points = Number(json.item?.uploader?.points || 0);
        if (points <= 20) {
          toast.success("Your first upload is live. Thanks for sharing.");
        } else if (points <= 180) {
          toast.success("Uploaded. Thanks for sharing.");
        } else {
          toast.success("Uploaded. Thanks for sharing.");
        }
      } else {
        toast.error(json.error || "Couldn't publish. Check the fields and try again.");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  function handleShareAndContinue() {
    if (!published) return;
    sounds.tap();
    haptics.light();
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://campusloop.space"}/academics/study-material/${published.id}`;
    const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
    if (canShare) {
      navigator
        .share({ title: published.title, text: `${published.title} on CampusLoop`, url: shareUrl })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied. Share it with your class.");
    }
  }

  function handleContinueToResource() {
    if (!published) return;
    router.push(`/academics/study-material/${published.id}`);
  }

  const currentType = RESOURCE_TYPES.find((r) => r.id === resourceType) || RESOURCE_TYPES[0];

  // ─── Post-publish growth panel ───
  if (published) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 pt-16 pb-10 text-center space-y-5">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 border border-primary/25 text-primary">
          <PartyPopper className="size-8" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl text-fg">Your notes are up</h1>
          <p className="text-sm text-muted-foreground">
            “{published.title}” is now live. Share it with your class so they can find it.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleShareAndContinue}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-brand hover:bg-brand-hover text-brand-fg font-bold text-sm shadow-xs transition-colors active:scale-95 cursor-pointer"
          >
            <Share2 className="size-4" />
            <span>Share with my batch</span>
          </button>
          <button
            type="button"
            onClick={handleContinueToResource}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-border/50 hover:bg-muted text-foreground font-bold text-sm transition-colors cursor-pointer"
          >
            <span>View resource</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl pb-10 px-3 sm:px-5 lg:px-8 pt-2 sm:pt-4">
      {/* ─── Breadcrumb & Header ─── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link
              href="/academics/study-material"
              className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Study material</span>
            </Link>
            <span>/</span>
            <span className="text-foreground">Upload</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Upload study material</span>
            <span className="flex size-6.5 items-center justify-center rounded-md bg-brand-subtle text-brand-text border border-brand-subtle-border">
              <UploadCloud className="size-3.5" />
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-reward-subtle border border-reward/30 text-reward-text">
            <Zap className="size-4 text-reward fill-reward shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold">+20 Loop Points</p>
              <p className="text-xs text-fg-muted">For each upload</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── LEFT COLUMN ─── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title */}
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Title</span>
                <span className="text-xs text-fg-muted">Required</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS201 Complete Course Notes, All PYQs & Revision Slides"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border/40 bg-muted/30 px-3.5 text-sm font-bold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-colors"
              />
            </div>

            {/* Materials — modules, on top, where it belongs */}
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Package className="size-3.5" />
                  </span>
                  <h2 className="text-sm font-bold text-fg">Materials</h2>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  {readyAttachmentsCount} {readyAttachmentsCount === 1 ? "file" : "files"} ready ·{" "}
                  {modules.length} {modules.length === 1 ? "module" : "modules"}
                </span>
              </div>

              <div className="space-y-4">
                {modules.map((module, idx) => (
                  <ModuleEditor
                    key={module.id}
                    module={module}
                    index={idx}
                    totalModules={modules.length}
                    linkDraft={getLinkDraft(module.id)}
                    onUpdateField={(patch) => updateModule(module.id, patch)}
                    onRemove={() => removeModule(module.id)}
                    onMoveUp={() => moveModule(module.id, "up")}
                    onMoveDown={() => moveModule(module.id, "down")}
                    onFilesUpload={(e) => handleFilesUpload(module.id, e)}
                    onToggleLinkPanel={() =>
                      setLinkDraft(module.id, { isOpen: !getLinkDraft(module.id).isOpen })
                    }
                    onLinkUrlChange={(url) => setLinkDraft(module.id, { url })}
                    onLinkTitleChange={(linkTitle) => setLinkDraft(module.id, { title: linkTitle })}
                    onAddLink={() => handleAddExternalLink(module.id)}
                    onCancelLink={() => setLinkDraft(module.id, { isOpen: false, url: "", title: "" })}
                    onRemoveAttachment={(attId) => removeAttachment(module.id, attId)}
                    onMoveAttachment={(attIdx, dir) => moveAttachment(module.id, attIdx, dir)}
                    onUpdateAttachment={(attId, patch) => updateAttachmentField(module.id, attId, patch)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={addModule}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add another module</span>
              </button>
            </div>

            {/* Short description of the whole resource — visible, not hidden */}
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>What's included?</span>
                <span className="text-xs text-muted-foreground font-normal">Optional</span>
              </label>
              <textarea
                rows={2}
                placeholder="Topics, chapters, professor, exam year"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-border/40 bg-muted/30 p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-colors resize-none"
              />
            </div>

            {/* Advanced details accordion — course/academic metadata, all optional */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setIsAdvancedOpen((v) => !v);
                }}
                aria-expanded={isAdvancedOpen}
                className="w-full flex items-center justify-between gap-2 p-5 sm:p-6 cursor-pointer"
              >
                <div className="text-left">
                  <h2 className="text-sm font-bold text-fg">More details</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Course, category and tags. All optional.
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform shrink-0",
                    isAdvancedOpen && "rotate-180"
                  )}
                />
              </button>

              {isAdvancedOpen && (
                <div className="px-5 sm:px-6 pb-6 space-y-5 border-t border-border/30 pt-5">
                  {/* What are you uploading? */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-fg-muted">What are you uploading?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {RESOURCE_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = resourceType === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              sounds.tap();
                              haptics.light();
                              setResourceType(type.id);
                            }}
                            className={cn(
                              "flex flex-col text-left p-3 rounded-xl border transition-colors cursor-pointer relative min-h-[88px]",
                              isSelected
                                ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40"
                                : "bg-muted/20 border-border/40 hover:bg-muted/40 hover:border-border/80"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-xl border",
                                  type.badgeColor
                                )}
                              >
                                <Icon className="size-4" />
                              </div>
                              {isSelected && (
                                <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                  <Check className="size-3 stroke-[3]" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-bold text-foreground">{type.label}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 leading-snug">
                              {type.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Course details */}
                  <div className="space-y-3 pt-2 border-t border-border/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-fg-muted">Course details</h3>
                      <button
                        type="button"
                        onClick={handleGenerateTitle}
                        className="flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-text hover:underline cursor-pointer"
                      >
                        <span>Use as title</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Subject Code</label>
                        <input
                          type="text"
                          placeholder="e.g. CS201, EC304, MA101"
                          value={subjectCode}
                          onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                          className="h-10 w-full rounded-2xl border border-border/40 bg-muted/30 px-3.5 text-xs sm:text-sm font-mono font-bold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Subject Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Data Structures & Algorithms"
                          value={subjectName}
                          onChange={(e) => setSubjectName(e.target.value)}
                          className="h-10 w-full rounded-2xl border border-border/40 bg-muted/30 px-3.5 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Academic details */}
                  <div className="space-y-3 pt-2 border-t border-border/20">
                    <h3 className="text-xs font-semibold text-fg-muted">Academic details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5 sm:col-span-1">
                        <label className="text-xs font-bold text-foreground">Target Branch</label>
                        <SearchableCombobox
                          options={BRANCH_OPTIONS}
                          value={branch}
                          onChange={(val) => setBranch(val)}
                          placeholder="Select branch..."
                          searchPlaceholder="Search branch, e.g. CSE"
                          clearable={false}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-1">
                        <label className="text-xs font-bold text-foreground">Semester</label>
                        <SearchableCombobox
                          options={SEMESTER_OPTIONS}
                          value={String(semester)}
                          onChange={(val) => setSemester(parseInt(val, 10) || 1)}
                          placeholder="Select semester..."
                          searchPlaceholder="Search semester (1–8)..."
                          clearable={false}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-1">
                        <label className="text-xs font-bold text-foreground">Module / Unit</label>
                        <input
                          type="text"
                          placeholder="e.g. Unit 1 to 5, All Modules"
                          value={moduleOrChapter}
                          onChange={(e) => setModuleOrChapter(e.target.value)}
                          className="h-10 w-full rounded-2xl border border-border/40 bg-muted/30 px-3.5 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tags — always visible, clearly optional */}
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="size-3.5 text-muted-foreground" />
                <h2 className="text-sm font-bold text-fg">
                  Tags <span className="text-fg-muted font-normal">(optional)</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Add a tag, e.g. Endsem2024"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    className="h-9.5 w-full rounded-2xl border border-border/40 bg-muted/30 pl-10 pr-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-3.5 h-9.5 rounded-2xl bg-muted/60 hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer shrink-0"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      aria-label={`Remove tag ${t}`}
                      className="cursor-pointer hover:text-foreground ml-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/20">
                <span className="text-xs font-semibold text-muted-foreground">Quick suggestions:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COMMON_TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddTag(s)}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer"
                    >
                      +{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Live Preview & Publish ─── */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
              <h2 className="font-sans text-sm font-semibold text-fg-muted">Preview</h2>

              <div className="rounded-lg border border-border bg-bg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-brand-subtle text-brand-text font-mono text-xs font-bold">
                    {subjectCode.trim() || "General"}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-xs font-semibold border",
                      currentType.badgeColor
                    )}
                  >
                    {currentType.label}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
                    {title.trim() || "Your title"}
                  </h4>
                  {subjectName.trim() && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{subjectName.trim()}</p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                  {description.trim() || "Your description shows here."}
                </p>

                {modules.some((m) => m.attachments.length > 0) && (
                  <div className="space-y-1.5 pt-1.5 border-t border-border/30">
                    <span className="text-xs font-semibold text-fg-muted">
                      Modules ({modules.filter((m) => m.attachments.length > 0).length})
                    </span>
                    <div className="space-y-1">
                      {modules
                        .filter((m) => m.attachments.length > 0)
                        .slice(0, 3)
                        .map((m, i) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-1.5 text-xs text-foreground font-semibold truncate bg-muted/30 px-2 py-1 rounded-lg"
                          >
                            <Package className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              {m.title.trim() || `Module ${i + 1}`} · {m.attachments.length}{" "}
                              {m.attachments.length === 1 ? "file" : "files"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/30">
                  <span>Sem {semester}</span>
                  <span>•</span>
                  <span className="truncate">{branch}</span>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs font-mono text-primary">
                        #{t}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-border/30 text-xs">
                <span className="text-xs font-semibold text-fg-muted">Readiness Checklist</span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "size-4 rounded-full flex items-center justify-center shrink-0 text-xs",
                        hasTitle ? "bg-success-subtle text-success" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {hasTitle ? <Check className="size-2.5 stroke-[3]" /> : "•"}
                    </div>
                    <span className={hasTitle ? "text-foreground font-semibold" : "text-muted-foreground"}>
                      Title set
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "size-4 rounded-full flex items-center justify-center shrink-0 text-xs",
                        readyAttachmentsCount > 0
                          ? "bg-success-subtle text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {readyAttachmentsCount > 0 ? <Check className="size-2.5 stroke-[3]" /> : "•"}
                    </div>
                    <span
                      className={
                        readyAttachmentsCount > 0 ? "text-foreground font-semibold" : "text-muted-foreground"
                      }
                    >
                      {readyAttachmentsCount > 0
                        ? `${readyAttachmentsCount} file${readyAttachmentsCount > 1 ? "s" : ""} attached`
                        : "Attach at least 1 file or link"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-brand hover:bg-brand-hover text-brand-fg font-bold text-xs shadow-xs transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Publishing…</span>
                  </>
                ) : (
                  <>
                    <Rocket className="size-4" />
                    <span>Publish</span>
                  </>
                )}
              </button>

              <div className="flex items-start gap-2 text-xs text-muted-foreground/80 leading-snug pt-1">
                <ShieldCheck className="size-4 text-fg-subtle shrink-0 mt-0.5" aria-hidden="true" />
                <span>Only upload material you are allowed to share.</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Module Editor (one card per module; progressive disclosure for titles/descriptions) ───

interface ModuleEditorProps {
  module: UploadModuleItem;
  index: number;
  totalModules: number;
  linkDraft: LinkDraft;
  onUpdateField: (patch: Partial<UploadModuleItem>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onFilesUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleLinkPanel: () => void;
  onLinkUrlChange: (url: string) => void;
  onLinkTitleChange: (title: string) => void;
  onAddLink: () => void;
  onCancelLink: () => void;
  onRemoveAttachment: (attId: string) => void;
  onMoveAttachment: (idx: number, dir: "up" | "down") => void;
  onUpdateAttachment: (attId: string, patch: Partial<UploadAttachmentItem>) => void;
}

function ModuleEditor({
  module,
  index,
  totalModules,
  linkDraft,
  onUpdateField,
  onRemove,
  onMoveUp,
  onMoveDown,
  onFilesUpload,
  onToggleLinkPanel,
  onLinkUrlChange,
  onLinkTitleChange,
  onAddLink,
  onCancelLink,
  onRemoveAttachment,
  onMoveAttachment,
  onUpdateAttachment,
}: ModuleEditorProps) {
  const inputId = `module-files-${module.id}`;

  return (
    <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 space-y-3">
      {/* Module header */}
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0">
          {index + 1}
        </span>
        <input
          type="text"
          placeholder={
            totalModules > 1
              ? `Module ${index + 1} title (optional) e.g. Unit 1 — Arrays`
              : "Module title (optional)"
          }
          value={module.title}
          onChange={(e) => onUpdateField({ title: e.target.value })}
          className="flex-1 min-w-0 bg-transparent text-sm font-bold text-foreground placeholder:text-muted-foreground/70 placeholder:font-medium outline-none"
        />
        <div className="flex items-center gap-1 shrink-0">
          {totalModules > 1 && (
            <>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={index === 0}
                className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-colors cursor-pointer"
                title="Move module up"
                aria-label="Move module up"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={index === totalModules - 1}
                className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-colors cursor-pointer"
                title="Move module down"
                aria-label="Move module down"
              >
                <ArrowDown className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Remove module"
                aria-label="Remove module"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {(totalModules > 1 || module.description) && (
        <input
          type="text"
          placeholder="What's in this module? (optional)"
          value={module.description}
          onChange={(e) => onUpdateField({ description: e.target.value })}
          className="w-full bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/60 outline-none border-b border-dashed border-border/30 pb-1.5"
        />
      )}

      {/* Dropzone & link controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <label
          htmlFor={inputId}
          className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-colors cursor-pointer text-center group"
        >
          <input
            id={inputId}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.txt,.html,.htm"
            onChange={onFilesUpload}
            className="hidden"
          />
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform mb-1.5">
            <UploadCloud className="size-4" />
          </div>
          <p className="text-xs font-bold text-foreground">Add files</p>
          <p className="text-xs text-muted-foreground mt-0.5">PDF, PPT, DOCX, HTML, images</p>
        </label>

        <button
          type="button"
          onClick={onToggleLinkPanel}
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer text-center group",
            linkDraft.isOpen
              ? "border-primary bg-primary/5 shadow-xs"
              : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/50"
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-md bg-brand-subtle text-brand-text border border-brand-subtle-border group-hover:scale-105 transition-transform mb-1.5">
            <Link2 className="size-4" />
          </div>
          <p className="text-xs font-bold text-foreground">Add link</p>
          <p className="text-xs text-muted-foreground mt-0.5">Drive, Web, YouTube — auto preview</p>
        </button>
      </div>

      {linkDraft.isOpen && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="url"
              placeholder="https://drive.google.com/... or YouTube link"
              value={linkDraft.url}
              onChange={(e) => onLinkUrlChange(e.target.value)}
              className="h-9 w-full rounded-xl border border-border/40 bg-background px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
            <input
              type="text"
              placeholder="Label (optional)"
              value={linkDraft.title}
              onChange={(e) => onLinkTitleChange(e.target.value)}
              className="h-9 w-full rounded-xl border border-border/40 bg-background px-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancelLink}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onAddLink}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Attach Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Attachment list */}
      {module.attachments.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {module.attachments.map((att, idx) => {
            const Icon = getAttachmentIcon(att.type);
            const isVideo = att.type === "VIDEO";
            return (
              <div
                key={att.id}
                className="rounded-lg border border-border bg-bg transition-colors overflow-hidden"
              >
                <div className="flex items-center gap-2.5 p-2.5">
                  {att.previewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={att.previewImage}
                      alt=""
                      className="size-9 rounded-lg object-cover border border-border/40 shrink-0"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60 text-foreground border border-border/40 shrink-0">
                      <Icon className="size-4" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <input
                      type="text"
                      value={att.title}
                      onChange={(e) => onUpdateAttachment(att.id, { title: e.target.value })}
                      placeholder="File title"
                      className="w-full bg-transparent text-xs font-bold text-foreground outline-none focus:underline"
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="px-1.5 py-0.2 rounded-sm bg-surface-muted font-mono font-bold text-fg">
                        {att.type}
                      </span>
                      {att.previewSiteName && <span className="truncate">{att.previewSiteName}</span>}
                      {att.sizeBytes && <span>{(att.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>}
                      {att.status === "uploading" && (
                        <span className="text-primary font-bold flex items-center gap-1">
                          <Loader2 className="size-2.5 animate-spin" />
                          <span>Uploading {att.uploadProgress ?? 0}%</span>
                        </span>
                      )}
                      {att.status === "error" && (
                        <span className="text-destructive font-bold">{att.error || "Upload error"}</span>
                      )}
                      {att.status === "ready" && (
                        <span className="text-success font-bold flex items-center gap-0.5">
                          <Check className="size-2.5" />
                          <span>Ready</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onMoveAttachment(idx, "up")}
                      disabled={idx === 0}
                      className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move up"
                      aria-label="Move attachment up"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveAttachment(idx, "down")}
                      disabled={idx === module.attachments.length - 1}
                      className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move down"
                      aria-label="Move attachment down"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(att.id)}
                      className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer ml-1"
                      title="Remove"
                      aria-label="Remove attachment"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {isVideo && (
                  <div className="px-2.5 pb-2.5 -mt-1">
                    <input
                      type="text"
                      placeholder="Notes for this video (shown under the player)"
                      value={att.notes || ""}
                      onChange={(e) => onUpdateAttachment(att.id, { notes: e.target.value })}
                      className="w-full bg-muted/30 rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none border border-border/30 focus:border-primary transition-colors"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
