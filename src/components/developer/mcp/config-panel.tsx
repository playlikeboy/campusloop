"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { IDE_TABS, type IdeId } from "./snippets";

const HINTS: Record<IdeId, React.ReactNode> = {
  cursor: (
    <>
      Paste into <code>.cursor/mcp.json</code>, or add it in Cursor Settings, MCP, Add new server, with type{" "}
      <code>HTTP</code>.
    </>
  ),
  claude: (
    <>
      Add it to <code>claude_desktop_config.json</code> under <code>mcpServers</code>. The{" "}
      <code>mcp-remote</code> bridge connects Claude Desktop to the server.
    </>
  ),
  windsurf: (
    <>
      Add it to <code>~/.codeium/windsurf/mcp_config.json</code> under <code>mcpServers</code>.
    </>
  ),
  cline: (
    <>
      Add it in Cline's MCP server settings with transport <code>SSE</code>.
    </>
  ),
  curl: <>A plain JSON-RPC 2.0 call. Works from any script or agent framework.</>,
};

/** Copy-ready MCP config for the chosen client and key. */
export function McpConfigPanel({
  tab,
  onTabChange,
  snippet,
  keyName,
  copied,
  onCopy,
}: {
  tab: IdeId;
  onTabChange: (tab: IdeId) => void;
  snippet: string;
  keyName?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section aria-labelledby="mcp-config" className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 id="mcp-config" className="text-xl text-fg">
            Connect your editor
          </h2>
          <p className="text-sm text-fg-muted">
            Uses the key <span className="font-semibold text-fg">{keyName ?? "you pick above"}</span>.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onCopy} className="self-start sm:self-auto">
          {copied ? <Check className="size-4 text-verified-text" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy config"}
        </Button>
      </div>
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <SegmentedControl
          size="sm"
          value={tab}
          onChange={onTabChange}
          options={IDE_TABS.map((t) => ({ value: t.id, label: t.label }))}
        />
      </div>
      <pre className="overflow-x-auto rounded-md border border-border bg-surface-sunken p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-fg">
        {snippet}
      </pre>
      <p className="text-sm text-fg-muted [&_code]:rounded-sm [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-fg">
        {HINTS[tab]}
      </p>
    </section>
  );
}
