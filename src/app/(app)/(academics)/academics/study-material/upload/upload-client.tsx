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
  Sparkles,
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
import { SearchableCombobox, type ComboboxOption } from "@/components/ui/searchable-combobox";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadMediaFile } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { getYoutubeEmbedInfo, isYoutubeUrl } from "@/lib/academics/youtube";

export type AttachmentType = "PDF" | "PPT" | "DOCX" | "IMAGE" | "DRIVE" | "LINK" | "VIDEO" | "HTML" | "CODE" | "OTHER";

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
    desc: "Classroom slides, topper handwritten notes, and professor summaries",
    icon: BookOpen,
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  },
  {
    id: "PYQ",
    label: "PYQs & Solutions",
    desc: "Past semester endsem/midsem exam papers with step-by-step solutions",
    icon: FileQuestion,
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  },
  {
    id: "CHEAT_SHEET",
    label: "Formula Cheat Sheet",
    desc: "Quick 15-minute exam revision sheets, formulas, and concept mind-maps",
    icon: Zap,
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/25",
  },
  {
    id: "LAB_MANUAL",
    label: "Lab Manual & Code",
    desc: "Lab experiments, circuit diagrams, viva questions, and source code",
    icon: FlaskConical,
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  },
  {
    id: "MODULE",
    label: "Unit / Module Pack",
    desc: "Comprehensive unit-wise notes tailored to specific syllabus chapters",
    icon: Layers,
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/25",
  },
  {
    id: "BOOK",
    label: "Reference Solutions",
    desc: "Problem solutions for standard university prescribed textbooks",
    icon: Bookmark,
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/25",
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

async function fetchLinkPreview(url: string): Promise<{ title?: string; image?: string; siteName?: string } | null> {
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

  function setModuleAttachments(moduleId: string, updater: (atts: UploadAttachmentItem[]) => UploadAttachmentItem[]) {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, attachments: updater(m.attachments) } : m)));
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
        toast.error(`"${file.name}" exceeds maximum allowed size of ${isHtml ? "3MB" : "50MB"}`);
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
            toast.success(`Uploaded "${file.name}"!`);
          } else {
            setModuleAttachments(moduleId, (atts) =>
              atts.map((item) => (item.id === tempId ? { ...item, status: "error", error: "Upload failed" } : item))
            );
            toast.error(`Failed to upload "${file.name}"`);
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
          toast.error(`Error uploading "${file.name}"`);
        });
    }

    e.target.value = "";
  }

  // Add external link / Google Drive / YouTube, with automatic preview
  async function handleAddExternalLink(moduleId: string) {
    const draft = getLinkDraft(moduleId);
    const raw = draft.url.trim();
    if (!raw) {
      toast.error("Please enter a link or Google Drive URL");
      return;
    }
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      toast.error("Link must start with https:// or http://");
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
    toast.success("Link attached!");

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
      toast.info("Add a Subject Code or Subject Name in Advanced details first to auto-generate a title");
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
      toast.error("Give your study pack a title first");
      return;
    }
    if (hasUploading) {
      toast.info("Please wait for all files to finish uploading before publishing");
      return;
    }
    if (readyAttachmentsCount === 0) {
      toast.error("Attach at least one file or link to a module before publishing");
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
          toast.success("🌱 First Contribution! You just helped future students.");
        } else if (points <= 180) {
          toast.success("🔥 Rising Contributor! Keep sharing great notes.");
        } else {
          toast.success("🏆 Top Contributor status! Your uploads are shaping the vault.");
        }
      } else {
        toast.error(json.error || "Failed to publish academic resource");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Network error while submitting resource");
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
        .share({ title: published.title, text: `Check out ${published.title} on CampusLoop!`, url: shareUrl })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied — share it with your batch!");
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
          <h1 className="text-xl font-black text-foreground">You just helped future students!</h1>
          <p className="text-sm text-muted-foreground">
            “{published.title}” is live on the Study Vault. Notes shared by top contributors get 5x more
            views — share yours now and watch it climb the Trending feed.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleShareAndContinue}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Share2 className="size-4" />
            <span>Share with my batch</span>
          </button>
          <button
            type="button"
            onClick={handleContinueToResource}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-border/50 hover:bg-muted text-foreground font-bold text-sm transition-all cursor-pointer"
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
              <span>Academic Vault</span>
            </Link>
            <span>/</span>
            <span className="text-foreground">Upload Studio</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Upload study material</span>
            <span className="flex size-6.5 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <UploadCloud className="size-3.5" />
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
            <Zap className="size-4 text-amber-400 fill-amber-400 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-black">+20 Loop Points</p>
              <p className="text-[10px] text-muted-foreground">Credited on verified upload</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── LEFT COLUMN ─── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title */}
            <div className="rounded-3xl border border-border/40 bg-card/60 p-5 sm:p-6 backdrop-blur-sm space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Title</span>
                <span className="text-[10px] text-muted-foreground uppercase">Required</span>
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
            <div className="rounded-3xl border border-border/40 bg-card/60 p-5 sm:p-6 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Package className="size-3.5" />
                  </span>
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Materials</h2>
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
                    onToggleLinkPanel={() => setLinkDraft(module.id, { isOpen: !getLinkDraft(module.id).isOpen })}
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
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 text-xs font-bold text-muted-foreground hover:text-primary transition-all cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add another module</span>
              </button>
            </div>

            {/* Short description of the whole resource — visible, not hidden */}
            <div className="rounded-3xl border border-border/40 bg-card/60 p-5 sm:p-6 backdrop-blur-sm space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>What's included?</span>
                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
              </label>
              <textarea
                rows={2}
                placeholder="A short note about the whole study pack — topics, chapters, professor, exam year..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-border/40 bg-muted/30 p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-colors resize-none"
              />
            </div>

            {/* Advanced details accordion — course/academic metadata, all optional */}
            <div className="rounded-3xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setIsAdvancedOpen((v) => !v);
                }}
                className="w-full flex items-center justify-between gap-2 p-5 sm:p-6 cursor-pointer"
              >
                <div className="text-left">
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                    Advanced details
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Course info, category &amp; tags — all optional
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
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      What are you uploading?
                    </h3>
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
                              "flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer relative min-h-[88px]",
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
                            <p className="text-xs font-black text-foreground">{type.label}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 leading-snug">
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
                      <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Course details
                      </h3>
                      <button
                        type="button"
                        onClick={handleGenerateTitle}
                        className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        <Sparkles className="size-3" />
                        <span>Generate title from this</span>
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
                          className="h-10 w-full rounded-2xl border border-border/40 bg-muted/30 px-3.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-background transition-colors"
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
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Academic details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5 sm:col-span-1">
                        <label className="text-xs font-bold text-foreground">Target Branch</label>
                        <SearchableCombobox
                          options={BRANCH_OPTIONS}
                          value={branch}
                          onChange={(val) => setBranch(val)}
                          placeholder="Select branch..."
                          searchPlaceholder="Search branch (e.g. CSE, IT, Mech)..."
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
            <div className="rounded-3xl border border-border/40 bg-card/60 p-5 sm:p-6 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="size-3.5 text-muted-foreground" />
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Tags <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Add exam tag (e.g. Endsem2024, TopperNotes)..."
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
                  className="px-3.5 h-9.5 rounded-2xl bg-muted/60 hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer shrink-0"
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
                      className="cursor-pointer hover:text-foreground ml-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/20">
                <span className="text-[11px] font-semibold text-muted-foreground">Quick suggestions:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COMMON_TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddTag(s)}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer"
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
            <div className="rounded-3xl border border-border/40 bg-card/75 p-5 backdrop-blur-md shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Live Vault Preview
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  100% Verified
                </span>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/80 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 font-mono text-[11px] font-black tracking-wider">
                    {subjectCode.trim() || "General"}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border",
                      currentType.badgeColor
                    )}
                  >
                    {currentType.label}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-foreground line-clamp-2 leading-snug">
                    {title.trim() || "Document Title Preview"}
                  </h4>
                  {subjectName.trim() && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{subjectName.trim()}</p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                  {description.trim() || "Curated notes covering core examination topics and syllabus modules."}
                </p>

                {modules.some((m) => m.attachments.length > 0) && (
                  <div className="space-y-1.5 pt-1.5 border-t border-border/30">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Modules ({modules.filter((m) => m.attachments.length > 0).length})
                    </span>
                    <div className="space-y-1">
                      {modules
                        .filter((m) => m.attachments.length > 0)
                        .slice(0, 3)
                        .map((m, i) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-1.5 text-[11px] text-foreground font-semibold truncate bg-muted/30 px-2 py-1 rounded-lg"
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

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                  <span>Sem {semester}</span>
                  <span>•</span>
                  <span className="truncate">{branch}</span>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] font-mono text-primary">
                        #{t}
                      </span>
                    ))}
                    {tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-border/30 text-xs">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Readiness Checklist
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "size-4 rounded-full flex items-center justify-center shrink-0 text-[10px]",
                        hasTitle ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
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
                        "size-4 rounded-full flex items-center justify-center shrink-0 text-[10px]",
                        readyAttachmentsCount > 0
                          ? "bg-emerald-500/20 text-emerald-400"
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
                className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Publishing Material...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="size-4" />
                    <span>Publish to Vault (+20 LP)</span>
                  </>
                )}
              </button>

              <div className="flex items-start gap-2 text-[11px] text-muted-foreground/80 leading-snug pt-1">
                <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Resources are distributed under verified student fair-use for academic learning &amp; peer
                  collaboration.
                </span>
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
        <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-black text-muted-foreground shrink-0">
          {index + 1}
        </span>
        <input
          type="text"
          placeholder={totalModules > 1 ? `Module ${index + 1} title (optional) e.g. Unit 1 — Arrays` : "Module title (optional)"}
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
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-all cursor-pointer"
                title="Move module up"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={index === totalModules - 1}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-all cursor-pointer"
                title="Move module down"
              >
                <ArrowDown className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                title="Remove module"
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
          className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all cursor-pointer text-center group"
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
          <p className="text-[11px] font-black text-foreground">Add files</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">PDF, PPT, DOCX, HTML, images</p>
        </label>

        <button
          type="button"
          onClick={onToggleLinkPanel}
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center group",
            linkDraft.isOpen
              ? "border-primary bg-primary/5 shadow-xs"
              : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/50"
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform mb-1.5">
            <Link2 className="size-4" />
          </div>
          <p className="text-[11px] font-black text-foreground">Add link</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Drive, Web, YouTube — auto preview</p>
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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black bg-primary text-primary-foreground hover:opacity-90 shadow-xs transition-all cursor-pointer"
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
                className="rounded-xl border border-border/50 bg-background/75 backdrop-blur-sm transition-all shadow-2xs overflow-hidden"
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
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                      <span className="px-1.5 py-0.2 rounded bg-muted font-mono font-bold uppercase tracking-wider text-foreground">
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
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
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
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-all cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveAttachment(idx, "down")}
                      disabled={idx === module.attachments.length - 1}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-all cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(att.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer ml-1"
                      title="Remove"
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
                      className="w-full bg-muted/30 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground outline-none border border-border/30 focus:border-primary transition-colors"
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
