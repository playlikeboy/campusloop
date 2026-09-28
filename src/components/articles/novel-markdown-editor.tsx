"use client";

import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Check,
  Code,
  Columns2,
  Copy,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Quote,
  Redo,
  Sparkles,
  Strikethrough,
  Undo,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import TurndownService from "turndown";
import { MarkdownContent } from "@/components/common/markdown-content";
import { haptics } from "@/lib/haptics";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn } from "@/lib/utils";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

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
  category: "Basic" | "Media & Code";
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
    content: initialContent ? convertMarkdownToHtml(initialContent) : "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[360px] text-foreground text-[16px] sm:text-[17px] leading-relaxed px-4 sm:px-8 py-6 font-normal selection:bg-primary/20 selection:text-foreground",
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

  // Handle direct image uploads from drag/drop/paste
  async function handleDirectUpload(file: File) {
    if (!editor) return;
    setIsUploading(true);
    toast.loading("Uploading image to Cloud...", { id: "editor-img" });
    try {
      const res = await uploadImageToImgBB(file);
      const url = res.displayUrl || res.url;
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      toast.success("Image embedded", { id: "editor-img" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image", { id: "editor-img" });
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
        description: "Just start writing plain body text.",
        icon: FileText,
        category: "Basic",
        action: (ed) => ed.chain().focus().setParagraph().run(),
      },
      {
        id: "h1",
        title: "Heading 1",
        description: "Large section header for major chapters.",
        icon: Heading1,
        category: "Basic",
        action: (ed) => ed.chain().focus().setHeading({ level: 1 }).run(),
      },
      {
        id: "h2",
        title: "Heading 2",
        description: "Medium header for topic subsections.",
        icon: Heading2,
        category: "Basic",
        action: (ed) => ed.chain().focus().setHeading({ level: 2 }).run(),
      },
      {
        id: "h3",
        title: "Heading 3",
        description: "Small header for detailed sub-points.",
        icon: Heading3,
        category: "Basic",
        action: (ed) => ed.chain().focus().setHeading({ level: 3 }).run(),
      },
      {
        id: "bullet-list",
        title: "Bullet List",
        description: "Create a simple unordered bulleted list.",
        icon: List,
        category: "Basic",
        action: (ed) => ed.chain().focus().toggleBulletList().run(),
      },
      {
        id: "ordered-list",
        title: "Numbered List",
        description: "Create a numbered 1, 2, 3 ordered list.",
        icon: ListOrdered,
        category: "Basic",
        action: (ed) => ed.chain().focus().toggleOrderedList().run(),
      },
      {
        id: "quote",
        title: "Quote",
        description: "Capture a standout student quote or tip.",
        icon: Quote,
        category: "Basic",
        action: (ed) => ed.chain().focus().toggleBlockquote().run(),
      },
      {
        id: "code",
        title: "Code Block",
        description: "Syntax code block for C++, Python, or Web code.",
        icon: Code,
        category: "Media & Code",
        action: (ed) => ed.chain().focus().toggleCodeBlock().run(),
      },
      {
        id: "divider",
        title: "Divider",
        description: "Visually separate sections with a horizontal rule.",
        icon: Minus,
        category: "Media & Code",
        action: (ed) => ed.chain().focus().setHorizontalRule().run(),
      },
      {
        id: "image",
        title: "Upload Image",
        description: "Embed an image, diagram, or campus photo.",
        icon: ImageIcon,
        category: "Media & Code",
        action: () => fileInputRef.current?.click(),
      },
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
    toast.success("Markdown copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRawMarkdownChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setRawMarkdown(val);
    onChange(val);
    if (editor) {
      editor.commands.setContent(convertMarkdownToHtml(val), { emitUpdate: false });
    }
  }

  return (
    <div
      ref={editorContainerRef}
      className={cn(
        "relative flex flex-col rounded-2xl border border-border/50 bg-card text-foreground shadow-xs transition-all overflow-hidden",
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
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/40 bg-muted/30 backdrop-blur-md flex-wrap gap-2 text-xs text-muted-foreground">
        {/* Left: Quick Format Bar */}
        <div className="flex items-center gap-1 flex-wrap">
          {editor && viewMode === "visual" && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="size-3.5" />
              </button>

              <div className="w-px h-4 bg-border/60 mx-1" />

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  editor.isActive("bold")
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Bold (Ctrl+B)"
              >
                <Bold className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  editor.isActive("italic")
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Italic (Ctrl+I)"
              >
                <Italic className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  editor.isActive("code")
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                  "p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                  editor.isActive("heading", { level: 1 })
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Heading 1"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                  editor.isActive("heading", { level: 2 })
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  editor.isActive("bulletList")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Bullet List"
              >
                <List className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  editor.isActive("blockquote")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Quote"
              >
                <Quote className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Embed image"
              >
                {isUploading ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
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
          <div className="flex items-center bg-muted/60 border border-border/40 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("visual")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                viewMode === "visual"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1",
                viewMode === "split"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Columns2 className="size-3" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                viewMode === "raw"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Markdown
            </button>
          </div>

          {/* Copy Markdown */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer"
            title="Copy Markdown"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
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
          className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-2xl p-1 shadow-2xl text-popover-foreground animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer",
              editor.isActive("bold") ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
            )}
            title="Bold"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer",
              editor.isActive("italic") ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
            )}
            title="Italic"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer",
              editor.isActive("strike") ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
            )}
            title="Strikethrough"
          >
            <Strikethrough className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer",
              editor.isActive("code") ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
            )}
            title="Inline Code"
          >
            <Code className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              "px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              editor.isActive("heading", { level: 2 })
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground"
            )}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer",
              editor.isActive("blockquote") ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
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
          className="absolute z-50 w-72 rounded-2xl border border-border/60 bg-popover/98 backdrop-blur-2xl shadow-2xl overflow-hidden p-1.5 text-popover-foreground animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: slashCoords ? Math.min(slashCoords.y, 450) : 100,
            left: slashCoords ? Math.min(slashCoords.x, 300) : 32,
          }}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-1">
            Blocks & Commands
          </div>

          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {filteredCommands.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">No matching blocks</div>
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
                      "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer",
                      isSelected
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border/40 text-muted-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</p>
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
              viewMode === "split" ? "border-r border-border/40" : ""
            )}
          >
            <EditorContent editor={editor} />
          </div>
        )}

        {/* Live Split Markdown Preview */}
        {viewMode === "split" && (
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 bg-muted/10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-4 pb-2 border-b border-primary/20 flex items-center gap-1.5">
              <Sparkles className="size-3" />
              <span>Live Student Article Preview</span>
            </div>
            <MarkdownContent content={rawMarkdown} />
          </div>
        )}

        {/* Raw Markdown Mode */}
        {viewMode === "raw" && (
          <textarea
            value={rawMarkdown}
            onChange={handleRawMarkdownChange}
            placeholder={placeholder}
            className="flex-1 w-full bg-transparent p-6 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none leading-relaxed"
          />
        )}
      </div>

      {/* ─── Bottom Footer Status Bar ─── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-card/80 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <strong className="text-foreground">{wordCount}</strong> words
          </span>
          <span className="text-border">·</span>
          <span>
            ~<strong className="text-foreground">{readingTime}</strong> min read
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground border border-border/40">
            /
          </kbd>
          <span>for slash commands</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Basic markdown to HTML converter for initializing TipTap
 */
function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";

  return markdown
    .split("\n\n")
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return "";

      // Headings
      if (trimmed.startsWith("### ")) {
        return `<h3>${trimmed.slice(4)}</h3>`;
      }
      if (trimmed.startsWith("## ")) {
        return `<h2>${trimmed.slice(3)}</h2>`;
      }
      if (trimmed.startsWith("# ")) {
        return `<h1>${trimmed.slice(2)}</h1>`;
      }

      // Blockquotes
      if (trimmed.startsWith("> ")) {
        return `<blockquote><p>${trimmed.slice(2)}</p></blockquote>`;
      }

      // Images
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        return `<img src="${imgMatch[2]}" alt="${imgMatch[1]}" />`;
      }

      // Horizontal rules
      if (trimmed === "---" || trimmed === "***") {
        return "<hr />";
      }

      // Code blocks
      if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
        const codeLines = trimmed.slice(3, -3).split("\n");
        const code = codeLines.slice(1).join("\n") || codeLines[0];
        return `<pre><code>${code}</code></pre>`;
      }

      // Bullet lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed
          .split("\n")
          .map((line) => `<li>${line.replace(/^[-*]\s+/, "")}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      // Standard paragraphs
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}
