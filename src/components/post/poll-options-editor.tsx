"use client";

import { BarChart3, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface PollOptionsEditorProps {
  options: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function PollOptionsEditor({ options, onChange, onAdd, onRemove }: PollOptionsEditorProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <div className="mx-4 sm:mx-5 mb-4 rounded-2xl border border-success/20 bg-success/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <BarChart3 className="size-4 text-success" /> Voting Options
            </span>
            {options.length < 6 && (
              <button
                type="button"
                onClick={onAdd}
                className="flex items-center gap-1 rounded-xl border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-bold text-success transition-transform hover:bg-success/20 active:scale-95 cursor-pointer"
              >
                <Plus className="size-3" /> Add Option
              </button>
            )}
          </div>

          <div className="space-y-2">
            {options.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-2"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-success/15 text-xs font-bold text-success border border-success/20 shadow-xs">
                  {String.fromCharCode(65 + index)}
                </span>
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  required={index < 2}
                  maxLength={80}
                  onChange={(e) => onChange(index, e.target.value)}
                  className="h-10 flex-1 rounded-md border border-border bg-surface px-3.5 text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-success/50 focus:ring-1 focus:ring-success/20 shadow-xs"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    aria-label={`Remove option ${index + 1}`}
                    className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer active:scale-95"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          <p className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>Add at least 2 options</span>
            <span className="tabular-nums font-bold">{options.filter((o) => o.trim()).length}/6 options</span>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
