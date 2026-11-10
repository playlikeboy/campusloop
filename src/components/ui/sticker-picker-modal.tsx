"use client";

import { BookOpen, Code2, Coffee, Flame, Headphones, Search, Smile, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { CAMPUS_STICKERS, type CampusSticker, STICKER_CATEGORIES } from "@/constants/stickers";
import { cn } from "@/lib/utils";

function getCategoryIcon(id: string) {
  switch (id) {
    case "all":
      return <Flame className="size-3 text-reward-text" />;
    case "campus":
      return <Coffee className="size-3 text-warning" />;
    case "exams":
      return <BookOpen className="size-3 text-brand-text" />;
    case "coding":
      return <Code2 className="size-3 text-success" />;
    case "reactions":
      return <Smile className="size-3 text-brand-text" />;
    case "fest":
      return <Headphones className="size-3 text-crush-text" />;
    default:
      return <Flame className="size-3" />;
  }
}

interface StickerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: CampusSticker) => void;
}

export function StickerPickerModal({ isOpen, onClose, onSelectSticker }: StickerPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredStickers = useMemo(() => {
    return CAMPUS_STICKERS.filter((s) => {
      const matchesCategory = selectedCategory === "all" || s.category === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.emoji?.includes(searchQuery);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-3 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-card p-4 shadow-2xl space-y-3.5 border border-border/30 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-reward-subtle flex items-center justify-center text-reward-text">
              <Smile className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Campus Stickers</h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Pick a sticker to send
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stickers (maggi, tea, exam, 75%, pass)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-sm border border-border bg-surface text-xs font-semibold text-fg placeholder:text-fg-subtle outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30 transition-colors"
            autoFocus
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
          {STICKER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                selectedCategory === cat.id
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {getCategoryIcon(cat.id)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Stickers Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2.5 p-1 scrollbar-none">
          {filteredStickers.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              onClick={() => {
                onSelectSticker(sticker);
                onClose();
              }}
              className="group flex flex-col items-center justify-between p-2 rounded-2xl bg-muted/30 hover:bg-muted/70 transition-colors cursor-pointer active:scale-95 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <div className="relative size-16 flex items-center justify-center overflow-hidden">
                <img
                  src={sticker.url}
                  alt={sticker.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-200"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] font-bold text-foreground/80 group-hover:text-foreground truncate w-full mt-1.5">
                {sticker.name}
              </span>
            </button>
          ))}

          {filteredStickers.length === 0 && (
            <div className="col-span-3 py-12 text-center text-xs text-muted-foreground space-y-1">
              <Zap className="size-5 mx-auto text-muted-foreground/50" />
              <p className="font-bold text-foreground">No stickers match &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-[10px]">
                Try searching &ldquo;chai&rdquo;, &ldquo;dead&rdquo;, &ldquo;exam&rdquo;, or
                &ldquo;fest&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
