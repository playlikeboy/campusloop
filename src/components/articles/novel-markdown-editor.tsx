"use client";

import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BarChart3,
  Bold,
  Calculator,
  CalendarClock,
  Check,
  Clapperboard,
  Code,
  Columns2,
  Copy,
  FileText,
  Gauge,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle,
  Image as ImageIcon,
  Italic,
  Lightbulb,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Maximize2,
  MessagesSquare,
  Minimize2,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Table2,
  Undo,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import TurndownService from "turndown";
import { MarkdownContent } from "@/components/common/markdown-content";
import { looksLikeMarkdown, markdownToEditorHtml } from "@/lib/articles/markdown-to-editor-html";
import { SMART_BLOCK_TEMPLATES } from "@/lib/articles/smart-block-templates";
import { type SmartBlockType, smartifyMarkdown } from "@/lib/articles/smart-blocks";
import { haptics } from "@/lib/haptics";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn } from "@/lib/utils";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// HTML tables (e.g. copied from ChatGPT) become ```table smart blocks: the editor
// has no table node, and a fenced block survives every round trip.
turndown.addRule("tableToSmartBlock", {
  filter: "table",
  replacement: (_content, node) => {
    const rows = Array.from((node as HTMLTableElement).querySelectorAll("tr")).map((tr) =>
      Array.from(tr.querySelectorAll("th,td")).map((c) =>
        (c.textContent || "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim()
      )
    );
    if (rows.length === 0) return "";
    const width = Math.max(...rows.map((r) => r.length));
    const line = (r: string[]) => `| ${Array.from({ length: width }, (_, i) => r[i] ?? "").join(" | ")} |`;
    const body = [line(rows[0]), `| ${Array(width).fill("---").join(" | ")} |`, ...rows.slice(1).map(line)];
    return `\n\n\`\`\`table\n${body.join("\n")}\n\`\`\`\n\n`;
  },
});

const SMART_ICONS: Record<SmartBlockType, React.ComponentType<{ className?: string }>> = {
  chart: BarChart3,
  table: Table2,
  comparison: Columns2,
  timeline: CalendarClock,
  steps: ListChecks,
  callout: Lightbulb,
  stats: Gauge,
  calculator: Calculator,
  quiz: HelpCircle,
  faq: MessagesSquare,
  embed: Clapperboard,
};

// Preserve images properly in Turndown
turndown.addRule("imageRule", {
  filter: "img",
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const alt = el.getAttribute("alt") || "Image";
    const src = el.getAttribute("src") || "";
    return `\n![${alt}](${src})\n`;
  },
});

interface NovelMarkdownEditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
}

interface SlashCommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "Basic" | "Media & Code" | "Smart blocks";
  action: (editor: any) => void;
}

export function NovelMarkdownEditor({
  initialContent,
  onChange,
  placeholder = "Type '/' for commands, or write freely...",
  className,
}: NovelMarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<"visual" | "split" | "raw">("visual");
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashCoords, setSlashCoords] = useState<{ x: number; y: number } | null>(null);
  const [bubbleCoords, setBubbleCoords] = useState<{ x: number; y: number } | null>(null);
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rawMarkdown, setRawMarkdown] = useState(initialContent);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Set after useEditor so paste handling can insert converted content.
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Initialize TipTap
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            const level = node.attrs.level;
            return `Heading ${level}...`;
          }
          return placeholder;
        },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: initialContent ? markdownToEditorHtml(initialContent) : "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[360px] text-fg text-base sm:text-lg leading-relaxed px-4 sm:px-8 py-6 font-normal",
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image/"));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            event.preventDefault();
            handleDirectUpload(file);
            return true;
          }
        }

        // Rich answers pasted from ChatGPT (or any Markdown): selecting and copying
        // gives HTML; the Copy button gives raw Markdown. Both are converted, and
        // tables and Note/Tip quotes become smart blocks.
        const html = event.clipboardData?.getData("text/html") || "";
        const text = event.clipboardData?.getData("text/plain") || "";
        let pastedMarkdown: string | null = null;
        if (html && /<(table|h[1-6]|pre|ol|ul|blockquote)\b/i.test(html))
          pastedMarkdown = turndown.turndown(html);
        else if (looksLikeMarkdown(text)) pastedMarkdown = text;
        const ed = editorRef.current;
        if (pastedMarkdown && ed) {
          event.preventDefault();
          const { markdown } = smartifyMarkdown(pastedMarkdown);
          ed.chain().focus().insertContent(markdownToEditorHtml(markdown)).run();
          const smartCount = (
            markdown.match(
              /^```(chart|table|comparison|timeline|steps|callout|stats|calculator|quiz|faq)\s*$/gm
            ) ?? []
          ).length;
          toast.success(
            smartCount > 0
              ? `Pasted with formatting. ${smartCount} smart block${smartCount === 1 ? "" : "s"} created.`
              : "Pasted with formatting."
          );
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find((f) => f.type.startsWith("image/"));
        if (imageFile) {
          event.preventDefault();
          handleDirectUpload(imageFile);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const md = turndown.turndown(html);
      setRawMarkdown(md);
      onChange(md);
      checkSlashCommandTrigger(ed);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      if (from !== to && !ed.state.selection.empty) {
        try {
          const startCoords = ed.view.coordsAtPos(from);
          const endCoords = ed.view.coordsAtPos(to);
          const midX = (startCoords.left + endCoords.right) / 2;
          setBubbleCoords({ x: midX, y: startCoords.top - 46 });
          setShowBubbleMenu(true);
        } catch {
          setShowBubbleMenu(false);
        }
      } else {
        setShowBubbleMenu(false);
      }
    },
  });
  editorRef.current = editor;

  // Handle direct image uploads from drag/drop/paste
  async function handleDirectUpload(file: File) {
    if (!editor) return;
    setIsUploading(true);
    toast.loading("Uploading image…", { id: "editor-img" });
    try {
      const res = await uploadImageToImgBB(file);
      const url = res.displayUrl || res.url;
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      toast.success("Image embedded", { id: "editor-img" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't upload the image. Try a smaller JPG or PNG.",
        { id: "editor-img" }
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Detect slash commands
  function checkSlashCommandTrigger(ed: any) {
    const { from } = ed.state.selection;
    const textBefore = ed.state.doc.textBetween(Math.max(0, from - 20), from, "\n", "\0");
    const match = textBefore.match(/\/([a-zA-Z0-9]*)$/);

    if (match) {
      setSlashQuery(match[1].toLowerCase());
      setShowSlashMenu(true);
      setSlashIndex(0);

      try {
        const coords = ed.view.coordsAtPos(from);
        if (coords) {
          setSlashCoords({ x: coords.left, y: coords.bottom + 8 });
        }
      } catch {
        setSlashCoords(null);
      }
    } else {
      setShowSlashMenu(false);
    }
  }

  // Keyboard navigation for slash commands
  useEffect(() => {
    if (!showSlashMenu || !editor) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[slashIndex]) {
          executeCommand(filteredCommands[slashIndex]);
        }
      } else if (e.key === "Escape") {
        setShowSlashMenu(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSlashMenu, slashIndex, editor]);

  // Execute selected slash command and remove the "/"
  function executeCommand(item: SlashCommandItem) {
    if (!editor) return;
    const { from } = editor.state.selection;
    const deleteLength = slashQuery.length + 1; // +1 for the '/'
    editor
      .chain()
      .focus()
      .deleteRange({ from: from - deleteLength, to: from })
      .run();
    item.action(editor);
    setShowSlashMenu(false);
    haptics.light();
  }

  // Available Novel.sh slash commands
  const slashCommands: SlashCommandItem[] = useMemo(
    () => [
      {
        id: "text",
        title: "Text",
        description: "Plain text.",
        icon: FileText,
        category: "Basic",
        action: (ed) => ed.chain().focus().setParagraph().run(),
      },
      {
        id: "h1",
        title: "Heading 1",
        description: "Big section title.",
        icon: Heading1,
        category: "Basic",
        action: (ed) => ed.chain().focus().setHeading({ level: 1 }).run(),
      },
      {
        id: "h2",
        title: "Heading 2",
        description: "Smaller section title.",
        icon: Heading2,
        category: "Basic",
        action: (ed) => ed.chain().focus().setHeading({ level: 2 }).run(),
      },
      {
        id: "h3",
        title: "Heading 3",
        description: "Small title.",
        icon: Heading3,
        category: "Basic",
        action: (ed) => ed.chain().focus().setHeading({ level: 3 }).run(),
      },
      {
        id: "bullet-list",
        title: "Bullet list",
        description: "A list with bullets.",
        icon: List,
        category: "Basic",
        action: (ed) => ed.chain().focus().toggleBulletList().run(),
      },
      {
        id: "ordered-list",
        title: "Numbered list",
        description: "A numbered list.",
        icon: ListOrdered,
        category: "Basic",
        action: (ed) => ed.chain().focus().toggleOrderedList().run(),
      },
      {
        id: "quote",
        title: "Quote",
        description: "Highlight a quote or tip.",
        icon: Quote,
        category: "Basic",
        action: (ed) => ed.chain().focus().toggleBlockquote().run(),
      },
      {
        id: "code",
        title: "Code block",
        description: "Code with highlighting.",
        icon: Code,
        category: "Media & Code",
        action: (ed) => ed.chain().focus().toggleCodeBlock().run(),
      },
      {
        id: "divider",
        title: "Divider",
        description: "A line between sections.",
        icon: Minus,
        category: "Media & Code",
        action: (ed) => ed.chain().focus().setHorizontalRule().run(),
      },
      {
        id: "image",
        title: "Image",
        description: "Upload a photo or diagram.",
        icon: ImageIcon,
        category: "Media & Code",
        action: () => fileInputRef.current?.click(),
      },
      ...(
        Object.entries(SMART_BLOCK_TEMPLATES) as [
          SmartBlockType,
          (typeof SMART_BLOCK_TEMPLATES)[SmartBlockType],
        ][]
      ).map(
        ([type, tpl]): SlashCommandItem => ({
          id: `smart-${type}`,
          title: tpl.title,
          description: tpl.description,
          icon: SMART_ICONS[type],
          category: "Smart blocks",
          action: (ed) =>
            ed
              .chain()
              .focus()
              .insertContent({
                type: "codeBlock",
                attrs: { language: type },
                content: [{ type: "text", text: tpl.body }],
              })
              .run(),
        })
      ),
    ],
    []
  );

  const filteredCommands = useMemo(() => {
    if (!slashQuery) return slashCommands;
    return slashCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(slashQuery) ||
        c.description.toLowerCase().includes(slashQuery) ||
        c.id.includes(slashQuery)
    );
  }, [slashCommands, slashQuery]);

  const wordCount = useMemo(() => {
    const text = rawMarkdown.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [rawMarkdown]);

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  function handleCopyMarkdown() {
    navigator.clipboard.writeText(rawMarkdown);
    setCopied(true);
    toast.success("Markdown copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRawMarkdownChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setRawMarkdown(val);
    onChange(val);
    if (editor) {
      editor.commands.setContent(markdownToEditorHtml(val), { emitUpdate: false });
    }
  }

  return (
    <div
      ref={editorContainerRef}
      className={cn(
        "relative flex flex-col rounded-lg border border-border bg-surface text-fg shadow-xs transition-ui overflow-hidden",
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : "w-full",
        className
      )}
    >
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) handleDirectUpload(files[0]);
        }}
      />

      {/* ─── Notion-Style Sticky Header Toolbar ─── */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border bg-surface-muted flex-wrap gap-2 text-xs text-fg-muted">
        {/* Left: Quick Format Bar */}
        <div className="flex items-center gap-1 flex-wrap">
          {editor && viewMode === "visual" && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="inline-flex size-9 items-center justify-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-sunken disabled:opacity-30 transition-ui cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="inline-flex size-9 items-center justify-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-sunken disabled:opacity-30 transition-ui cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="size-3.5" />
              </button>

              <div className="w-px h-4 bg-border/60 mx-1" />

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full transition-ui cursor-pointer",
                  editor.isActive("bold")
                    ? "bg-brand-subtle text-brand-text font-bold"
                    : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
                )}
                title="Bold (Ctrl+B)"
              >
                <Bold className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full transition-ui cursor-pointer",
                  editor.isActive("italic")
                    ? "bg-brand-subtle text-brand-text font-bold"
                    : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
                )}
                title="Italic (Ctrl+I)"
              >
                <Italic className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full transition-ui cursor-pointer",
                  editor.isActive("code")
                    ? "bg-brand-subtle text-brand-text font-bold"
                    : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
                )}
                title="Inline Code"
              >
                <Code className="size-3.5" />
              </button>

              <div className="w-px h-4 bg-border/60 mx-1" />

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full text-xs font-bold transition-ui cursor-pointer",
                  editor.isActive("heading", { level: 1 })
                    ? "bg-brand-subtle text-brand-text"
                    : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
                )}
                title="Heading 1"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full text-xs font-bold transition-ui cursor-pointer",
                  editor.isActive("heading", { level: 2 })
                    ? "bg-brand-subtle text-brand-text"
                    : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
                )}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full transition-ui cursor-pointer",
                  editor.isActive("bulletList")
                    ? "bg-brand-subtle text-brand-text"
                    : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
                )}
                title="Bullet List"
              >
                <List className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full transition-ui cursor-pointer",
                  editor.isActive("blockquote")
                    ? "bg-brand-subtle text-brand-text"
                    : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
                )}
                title="Quote"
              >
                <Quote className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex size-9 items-center justify-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-sunken transition-ui cursor-pointer"
                title="Embed image"
              >
                {isUploading ? (
                  <Loader2 className="size-3.5 animate-spin text-brand-text" />
                ) : (
                  <ImageIcon className="size-3.5" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Right: View Mode, Stats & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-surface-muted border border-border rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("visual")}
              className={cn(
                "h-8 px-2.5 rounded-md text-xs font-semibold transition-ui cursor-pointer",
                viewMode === "visual" ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg"
              )}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={cn(
                "h-8 px-2.5 rounded-md text-xs font-semibold transition-ui cursor-pointer flex items-center gap-1",
                viewMode === "split" ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg"
              )}
            >
              <Columns2 className="size-3" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={cn(
                "h-8 px-2.5 rounded-md text-xs font-semibold transition-ui cursor-pointer",
                viewMode === "raw" ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg"
              )}
            >
              Markdown
            </button>
          </div>

          {/* Copy Markdown */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="inline-flex size-9 items-center justify-center rounded-full bg-surface hover:bg-surface-sunken text-fg-muted hover:text-fg border border-border transition-ui cursor-pointer"
            title="Copy Markdown"
            aria-label="Copy Markdown"
          >
            {copied ? <Check className="size-3.5 text-verified-text" /> : <Copy className="size-3.5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="inline-flex size-9 items-center justify-center rounded-full bg-surface hover:bg-surface-sunken text-fg-muted hover:text-fg border border-border transition-ui cursor-pointer"
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* ─── Floating Novel.sh Selection Bubble Menu ─── */}
      {editor && showBubbleMenu && bubbleCoords && (
        <div
          style={{
            position: "fixed",
            left: `${bubbleCoords.x}px`,
            top: `${bubbleCoords.y}px`,
            transform: "translateX(-50%)",
            zIndex: 60,
          }}
          className="flex items-center gap-0.5 rounded-xl border border-border bg-surface-raised p-1 shadow-lg text-fg animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full transition-ui cursor-pointer",
              editor.isActive("bold") ? "bg-brand text-brand-fg" : "hover:bg-surface-muted text-fg"
            )}
            title="Bold"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full transition-ui cursor-pointer",
              editor.isActive("italic") ? "bg-brand text-brand-fg" : "hover:bg-surface-muted text-fg"
            )}
            title="Italic"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full transition-ui cursor-pointer",
              editor.isActive("strike") ? "bg-brand text-brand-fg" : "hover:bg-surface-muted text-fg"
            )}
            title="Strikethrough"
          >
            <Strikethrough className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full transition-ui cursor-pointer",
              editor.isActive("code") ? "bg-brand text-brand-fg" : "hover:bg-surface-muted text-fg"
            )}
            title="Inline Code"
          >
            <Code className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              "px-2 py-1 rounded-lg text-xs font-bold transition-ui cursor-pointer",
              editor.isActive("heading", { level: 2 })
                ? "bg-brand text-brand-fg"
                : "hover:bg-surface-muted text-fg"
            )}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full transition-ui cursor-pointer",
              editor.isActive("blockquote") ? "bg-brand text-brand-fg" : "hover:bg-surface-muted text-fg"
            )}
            title="Quote"
          >
            <Quote className="size-3.5" />
          </button>
        </div>
      )}

      {/* ─── Floating Slash Command Popover ─── */}
      {showSlashMenu && (
        <div
          className="absolute z-50 w-72 rounded-lg border border-border bg-surface-raised shadow-lg overflow-hidden p-1.5 text-fg animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: slashCoords ? Math.min(slashCoords.y, 450) : 100,
            left: slashCoords ? Math.min(slashCoords.x, 300) : 32,
          }}
        >
          <div className="px-2.5 py-1.5 text-xs font-bold text-fg-muted border-b border-border mb-1">
            Add a block
          </div>

          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {filteredCommands.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-fg-muted">No matching blocks</div>
            ) : (
              filteredCommands.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === slashIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => executeCommand(item)}
                    onMouseEnter={() => setSlashIndex(idx)}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-ui cursor-pointer",
                      isSelected ? "bg-brand-subtle text-brand-text" : "hover:bg-surface-muted text-fg"
                    )}
                  >
                    <div
                      className={cn(
                        "size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
                        isSelected
                          ? "bg-brand text-brand-fg border-brand"
                          : "bg-surface-muted border-border text-fg-muted"
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-fg">{item.title}</p>
                      <p className="text-xs text-fg-muted line-clamp-1">{item.description}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── Editor Body Content ─── */}
      <div className="flex-1 flex overflow-hidden min-h-[420px]">
        {/* Visual TipTap Editor */}
        {(viewMode === "visual" || viewMode === "split") && (
          <div
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain",
              viewMode === "split" ? "border-r border-border" : ""
            )}
          >
            <EditorContent editor={editor} />
          </div>
        )}

        {/* Live Split Markdown Preview */}
        {viewMode === "split" && (
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 bg-surface-muted">
            <p className="mb-4 border-b border-border pb-2 text-xs font-semibold text-fg-muted">Preview</p>
            <MarkdownContent content={rawMarkdown} autoEmbed />
          </div>
        )}

        {/* Raw Markdown Mode */}
        {viewMode === "raw" && (
          <textarea
            value={rawMarkdown}
            onChange={handleRawMarkdownChange}
            placeholder={placeholder}
            className="flex-1 w-full bg-transparent p-6 text-sm font-mono text-fg placeholder:text-fg-subtle focus:outline-none resize-none leading-relaxed"
          />
        )}
      </div>

      {/* ─── Bottom Footer Status Bar ─── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface text-xs text-fg-muted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <strong className="text-fg">{wordCount}</strong> words
          </span>
          <span className="text-border">·</span>
          <span>
            ~<strong className="text-fg">{readingTime}</strong> min read
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <kbd className="px-1.5 py-0.5 rounded bg-surface-muted font-mono text-fg-muted border border-border">
            /
          </kbd>
          <span className="hidden sm:inline">for headings, lists, code and more</span>
        </div>
      </div>
    </div>
  );
}
