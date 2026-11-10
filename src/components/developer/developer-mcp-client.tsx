"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  createMcpKey,
  deleteMcpKey,
  regenerateMcpKey,
  testExecuteMcpTool,
  toggleMcpKey,
} from "@/app/(app)/(main)/developer/actions";
import { Button } from "@/components/ui/button";
import type { UserMcpKey } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { McpConfigPanel } from "./mcp/config-panel";
import { CreateKeyDialog, ToolPlaygroundDialog, type ToolRunResult } from "./mcp/dialogs";
import { McpKeyList } from "./mcp/key-list";
import { buildIdeSnippets, type IdeId } from "./mcp/snippets";
import { type McpTool, McpToolDirectory } from "./mcp/tool-directory";

interface DeveloperMcpClientProps {
  initialKeys: UserMcpKey[];
  studentUsername: string;
  collegeName: string;
}

/** Personal MCP keys, editor setup snippets and a tool playground. */
export function DeveloperMcpClient({ initialKeys, studentUsername, collegeName }: DeveloperMcpClientProps) {
  const [keys, setKeys] = useState<UserMcpKey[]>(initialKeys);
  const [selectedKeyId, setSelectedKeyId] = useState<string>(initialKeys[0]?.id || "");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeIdeTab, setActiveIdeTab] = useState<IdeId>("cursor");
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [activePlaygroundTool, setActivePlaygroundTool] = useState<string | null>(null);
  const [toolArgsInput, setToolArgsInput] = useState<string>("{}");
  const [runningTool, setRunningTool] = useState(false);
  const [toolExecutionResult, setToolExecutionResult] = useState<ToolRunResult | null>(null);

  const activeKey = keys.find((k) => k.id === selectedKeyId) || keys[0];
  const origin = typeof window !== "undefined" ? window.location.origin : "https://campusloop.space";
  const ideSnippets = buildIdeSnippets(origin, activeKey?.key || "cl_mcp_YOUR_KEY_TOKEN");

  // ── Key Actions ──
  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await createMcpKey(newKeyName);
      setKeys([created, ...keys]);
      setSelectedKeyId(created.id);
      setShowCreateModal(false);
      setNewKeyName("");
      toast.success("Key made");
      sounds.pop();
      haptics.medium();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't make the key. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(keyRecord: UserMcpKey) {
    sounds.tap();
    haptics.light();
    try {
      const updated = await toggleMcpKey(keyRecord.id, !keyRecord.isActive);
      setKeys(keys.map((k) => (k.id === keyRecord.id ? updated : k)));
      toast.success(updated.isActive ? "Key turned on" : "Key paused");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't change the key. Try again.");
    }
  }

  async function handleRegenerate(keyRecord: UserMcpKey) {
    if (
      !confirm(`Make a new token for '${keyRecord.name}'? Editors using the old one stop working right away.`)
    ) {
      return;
    }
    sounds.tap();
    haptics.medium();
    try {
      const updated = await regenerateMcpKey(keyRecord.id);
      setKeys(keys.map((k) => (k.id === keyRecord.id ? updated : k)));
      toast.success("New token made");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't make a new token. Try again.");
    }
  }

  async function handleDelete(keyRecord: UserMcpKey) {
    if (!confirm(`Delete '${keyRecord.name}'? This can't be undone.`)) {
      return;
    }
    sounds.tap();
    haptics.medium();
    try {
      await deleteMcpKey(keyRecord.id);
      const remaining = keys.filter((k) => k.id !== keyRecord.id);
      setKeys(remaining);
      if (selectedKeyId === keyRecord.id) {
        setSelectedKeyId(remaining[0]?.id || "");
      }
      toast.success("Key deleted");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't delete the key. Try again.");
    }
  }

  async function handleCopyKeyString(secret: string) {
    sounds.tap();
    haptics.light();
    if (navigator.clipboard) {
      await navigator.clipboard
        .writeText(secret)
        .catch(() => toast.error("Couldn't copy. Show the key and copy it yourself."));
      setCopiedKey(secret);
      toast.success("Key copied");
      setTimeout(() => setCopiedKey(null), 2500);
    }
  }

  async function handleCopyConfig() {
    sounds.tap();
    haptics.medium();
    try {
      await navigator.clipboard.writeText(ideSnippets[activeIdeTab]);
      setCopiedConfig(true);
      toast.success("Config copied");
      setTimeout(() => setCopiedConfig(false), 2500);
    } catch {
      toast.error("Couldn't copy. Select the config and copy it yourself.");
    }
  }

  // ── In-Browser Tool Playground Execution ──
  function openPlaygroundForTool(tool: McpTool) {
    setActivePlaygroundTool(tool.name);
    // Build default JSON template from properties
    const defaultArgs: Record<string, unknown> = {};
    for (const [propName, propDef] of Object.entries(tool.inputSchema.properties || {})) {
      if (propDef.default !== undefined) {
        defaultArgs[propName] = propDef.default;
      } else if (propDef.enum && propDef.enum.length > 0) {
        defaultArgs[propName] = propDef.enum[0];
      } else if (propDef.type === "string") {
        defaultArgs[propName] =
          propName === "query" ? "Campus" : propName === "body" ? "Hello CampusLoop!" : "";
      } else if (propDef.type === "integer" || propDef.type === "number") {
        defaultArgs[propName] = propDef.minimum || 5;
      } else if (propDef.type === "boolean") {
        defaultArgs[propName] = false;
      }
    }
    setToolArgsInput(JSON.stringify(defaultArgs, null, 2));
    setToolExecutionResult(null);
  }

  async function handleExecutePlaygroundTool() {
    if (!activePlaygroundTool) return;
    if (!activeKey) {
      toast.error("Make or pick a key first.");
      return;
    }

    sounds.pop();
    haptics.medium();
    setRunningTool(true);
    setToolExecutionResult(null);

    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(toolArgsInput || "{}");
    } catch {
      toast.error("The arguments aren't valid JSON. Check quotes and commas.");
      setRunningTool(false);
      return;
    }

    try {
      const res = await testExecuteMcpTool(activeKey.key, activePlaygroundTool, parsedArgs);
      setToolExecutionResult({
        latencyMs: res.latencyMs,
        success: res.success,
        data: res.response || res.error,
      });
      if (res.success) {
        toast.success("It worked");
      } else {
        toast.error("The tool returned an error. See the result below.");
      }
    } catch (err: any) {
      setToolExecutionResult({
        success: false,
        data: { error: err?.message || "Execution failed" },
      });
      toast.error("Couldn't run the tool. Check your connection.");
    } finally {
      setRunningTool(false);
    }
  }

  return (
    <div className="space-y-12 pb-20">
      <section aria-labelledby="mcp-keys" className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <h2 id="mcp-keys" className="text-xl text-fg">
              AI agent keys (MCP)
            </h2>
            <p className="text-sm text-fg-muted">
              Let Cursor, Windsurf, Claude Desktop or your own agent use CampusLoop as{" "}
              <span className="font-semibold text-fg">@{studentUsername}</span> from {collegeName}. Keys go in
              the Authorization header, never in a URL.
            </p>
          </div>
          <Button
            onClick={() => {
              sounds.tap();
              haptics.light();
              setShowCreateModal(true);
            }}
            className="self-start sm:self-auto"
          >
            <Plus className="size-4" />
            Make a key
          </Button>
        </div>
        <McpKeyList
          keys={keys}
          selectedKeyId={activeKey?.id ?? ""}
          onSelect={setSelectedKeyId}
          onCreate={() => setShowCreateModal(true)}
          onToggle={handleToggle}
          onRegenerate={handleRegenerate}
          onDelete={handleDelete}
          onCopy={handleCopyKeyString}
          copiedKey={copiedKey}
        />
      </section>

      <McpConfigPanel
        tab={activeIdeTab}
        onTabChange={(tab) => {
          sounds.tap();
          setActiveIdeTab(tab);
        }}
        snippet={ideSnippets[activeIdeTab]}
        keyName={activeKey?.name}
        copied={copiedConfig}
        onCopy={handleCopyConfig}
      />

      <McpToolDirectory onTry={openPlaygroundForTool} />

      <ToolPlaygroundDialog
        tool={activePlaygroundTool}
        onClose={() => setActivePlaygroundTool(null)}
        keyName={activeKey?.name}
        args={toolArgsInput}
        onArgsChange={setToolArgsInput}
        running={runningTool}
        onRun={handleExecutePlaygroundTool}
        result={toolExecutionResult}
      />

      <CreateKeyDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        name={newKeyName}
        onNameChange={setNewKeyName}
        creating={creating}
        onSubmit={handleCreateKey}
      />
    </div>
  );
}
