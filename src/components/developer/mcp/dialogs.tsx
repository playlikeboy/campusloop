"use client";

import { Plus, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateKeyDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  creating,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  creating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Make a new key</DialogTitle>
          <DialogDescription>
            Anything with this key can act as you: post, read your feed and message people. Keep it private.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mcp-key-name">Name it</Label>
            <Input
              id="mcp-key-name"
              placeholder="Cursor on my laptop"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              <Plus className="size-4" />
              Make key
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface ToolRunResult {
  latencyMs?: number;
  success: boolean;
  data: unknown;
}

export function ToolPlaygroundDialog({
  tool,
  onClose,
  keyName,
  args,
  onArgsChange,
  running,
  onRun,
  result,
}: {
  tool: string | null;
  onClose: () => void;
  keyName?: string;
  args: string;
  onArgsChange: (v: string) => void;
  running: boolean;
  onRun: () => void;
  result: ToolRunResult | null;
}) {
  return (
    <Dialog open={Boolean(tool)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg">{tool}</DialogTitle>
          <DialogDescription>
            Runs for real with your key{" "}
            <span className="font-semibold text-fg">{keyName ?? "none picked"}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="mcp-tool-args">Arguments (JSON)</Label>
          <Textarea
            id="mcp-tool-args"
            rows={6}
            value={args}
            onChange={(e) => onArgsChange(e.target.value)}
            className="font-mono text-xs"
            spellCheck={false}
          />
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onRun} loading={running}>
            <Send className="size-4" />
            {running ? "Running" : "Run"}
          </Button>
        </div>
        {result && (
          <div className="mt-4 space-y-2 border-t border-border pt-4" aria-live="polite">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-fg">Result</span>
              <span className="flex items-center gap-2">
                {result.latencyMs !== undefined && (
                  <span className="font-mono text-xs text-fg-muted tabular-nums">{result.latencyMs} ms</span>
                )}
                <Badge variant={result.success ? "success" : "danger"}>
                  {result.success ? "Worked" : "Failed"}
                </Badge>
              </span>
            </div>
            <pre className="max-h-60 overflow-auto rounded-md border border-border bg-surface-sunken p-3.5 font-mono text-xs whitespace-pre-wrap break-all text-fg">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
