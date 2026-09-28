"use client";

import {
  BrainCircuit,
  Check,
  Code2,
  Copy,
  Eye,
  EyeOff,
  Key,
  Layers,
  Loader2,
  Play,
  Plus,
  Power,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  createMcpKey,
  deleteMcpKey,
  regenerateMcpKey,
  testExecuteMcpTool,
  toggleMcpKey,
} from "@/app/(app)/(main)/developer/actions";
import { CAMPUSLOOP_MCP_TOOLS } from "@/lib/mcp/tools-catalog";
import type { UserMcpKey } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo } from "@/lib/utils";

interface DeveloperMcpClientProps {
  initialKeys: UserMcpKey[];
  studentUsername: string;
  collegeName: string;
}

export function DeveloperMcpClient({
  initialKeys,
  studentUsername,
  collegeName,
}: DeveloperMcpClientProps) {
  const [keys, setKeys] = useState<UserMcpKey[]>(initialKeys);
  const [selectedKeyId, setSelectedKeyId] = useState<string>(
    initialKeys[0]?.id || ""
  );

  // Key creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  // Key visibility & copy state
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active IDE Config Tab
  const [activeIdeTab, setActiveIdeTab] = useState<
    "cursor" | "claude" | "windsurf" | "cline" | "curl"
  >("cursor");
  const [copiedConfig, setCopiedConfig] = useState(false);

  // Tool catalog filtering & playground
  const [toolSearch, setToolSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activePlaygroundTool, setActivePlaygroundTool] = useState<string | null>(
    null
  );
  const [toolArgsInput, setToolArgsInput] = useState<string>("{}");
  const [runningTool, setRunningTool] = useState(false);
  const [toolExecutionResult, setToolExecutionResult] = useState<{
    latencyMs?: number;
    success: boolean;
    data: any;
  } | null>(null);

  const activeKey = keys.find((k) => k.id === selectedKeyId) || keys[0];
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://campusloop.space";

  const getMcpHttpUrl = useCallback(
    (keyToken: string) => `${origin}/api/mcp?key=${keyToken}`,
    [origin]
  );
  const getMcpSseUrl = useCallback(
    (keyToken: string) => `${origin}/api/mcp/sse?key=${keyToken}`,
    [origin]
  );

  const categories = [
    "ALL",
    "Exclusive AI & Intelligence",
    "Feed & Posts",
    "Direct Messaging",
    "Communities & Clubs",
    "Academics & Vault",
    "Colleges & Campuses",
    "Profile & Loop Points",
    "Stories & Vibes",
  ];

  const filteredTools = CAMPUSLOOP_MCP_TOOLS.filter((tool) => {
    const matchesCat =
      selectedCategory === "ALL" || tool.category === selectedCategory;
    const matchesSearch =
      !toolSearch ||
      tool.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
      tool.description.toLowerCase().includes(toolSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
      toast.success("New MCP API key created successfully!");
      sounds.pop();
      haptics.medium();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create key");
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
      toast.success(updated.isActive ? "Key activated" : "Key paused");
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle key");
    }
  }

  async function handleRegenerate(keyRecord: UserMcpKey) {
    if (
      !confirm(
        `Are you sure you want to regenerate '${keyRecord.name}'? Existing IDEs using this key will be disconnected immediately.`
      )
    ) {
      return;
    }
    sounds.tap();
    haptics.medium();
    try {
      const updated = await regenerateMcpKey(keyRecord.id);
      setKeys(keys.map((k) => (k.id === keyRecord.id ? updated : k)));
      toast.success("Secret key token regenerated!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to regenerate key");
    }
  }

  async function handleDelete(keyRecord: UserMcpKey) {
    if (
      !confirm(
        `Permanently delete '${keyRecord.name}'? This cannot be undone.`
      )
    ) {
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
      toast.error(err?.message || "Failed to delete key");
    }
  }

  async function handleCopyKeyString(secret: string) {
    sounds.tap();
    haptics.light();
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(secret);
      setCopiedKey(secret);
      toast.success("MCP API Key copied to clipboard!");
      setTimeout(() => setCopiedKey(null), 2500);
    }
  }

  function toggleTokenVisible(id: string) {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // ── IDE Snippet Generators ──
  const activeToken = activeKey?.key || "cl_mcp_YOUR_KEY_TOKEN";
  const httpEndpoint = getMcpHttpUrl(activeToken);
  const sseEndpoint = getMcpSseUrl(activeToken);

  const ideSnippets: Record<string, string> = {
    cursor: JSON.stringify(
      {
        mcpServers: {
          campusloop: {
            url: httpEndpoint,
          },
        },
      },
      null,
      2
    ),
    claude: JSON.stringify(
      {
        mcpServers: {
          campusloop: {
            command: "npx",
            args: ["-y", "mcp-remote", sseEndpoint],
          },
        },
      },
      null,
      2
    ),
    windsurf: JSON.stringify(
      {
        mcpServers: {
          campusloop: {
            serverUrl: httpEndpoint,
          },
        },
      },
      null,
      2
    ),
    cline: JSON.stringify(
      {
        mcpServers: {
          campusloop: {
            url: sseEndpoint,
            transport: "sse",
          },
        },
      },
      null,
      2
    ),
    curl: `curl -X POST "${httpEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "campusloop_get_my_profile",
      "arguments": {}
    }
  }'`,
  };

  async function handleCopyConfig() {
    sounds.tap();
    haptics.medium();
    const snippet = ideSnippets[activeIdeTab];
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(snippet);
      setCopiedConfig(true);
      toast.success("IDE configuration copied!");
      setTimeout(() => setCopiedConfig(false), 2500);
    }
  }

  // ── In-Browser Tool Playground Execution ──
  function openPlaygroundForTool(tool: (typeof CAMPUSLOOP_MCP_TOOLS)[0]) {
    setActivePlaygroundTool(tool.name);
    // Build default JSON template from properties
    const defaultArgs: Record<string, any> = {};
    for (const [propName, propDef] of Object.entries(
      tool.inputSchema.properties || {}
    )) {
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
      toast.error("Please create or select an active MCP key first");
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
      toast.error("Invalid JSON arguments format");
      setRunningTool(false);
      return;
    }

    try {
      const res = await testExecuteMcpTool(
        activeKey.key,
        activePlaygroundTool,
        parsedArgs
      );
      setToolExecutionResult({
        latencyMs: res.latencyMs,
        success: res.success,
        data: res.response || res.error,
      });
      if (res.success) {
        toast.success(`Executed ${activePlaygroundTool} successfully!`);
      } else {
        toast.error("Tool execution returned an error");
      }
    } catch (err: any) {
      setToolExecutionResult({
        success: false,
        data: { error: err?.message || "Execution failed" },
      });
      toast.error("Failed to execute tool");
    } finally {
      setRunningTool(false);
    }
  }

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* ─── Hero Card ─── */}
      <div className="rounded-[32px] border border-border/60 bg-card p-6 sm:p-8 shadow-2xs relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider">
              <BrainCircuit className="size-3.5" />
              <span>Model Context Protocol (MCP)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Connect CampusLoop to Any IDE or AI Agent
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Equip Cursor, Windsurf, Claude Desktop, Antigravity, or your custom
              agents with full platform access under your verified student identity (
              <span className="font-bold text-foreground">@{studentUsername}</span> at{" "}
              <span className="font-bold text-foreground">{collegeName}</span>).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                haptics.light();
                setShowCreateModal(true);
              }}
              className="h-11 px-5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Plus className="size-4" />
              <span>Generate API Key</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Key Management Card ─── */}
      <div className="rounded-[32px] border border-border/60 bg-card p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Key className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-foreground">Your MCP API Keys</h2>
              <p className="text-xs text-muted-foreground">
                Manage personal keys and select which key is used for IDE config generation below.
              </p>
            </div>
          </div>
        </div>

        {keys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-3 bg-muted/10">
            <div className="size-10 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <Key className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">No MCP API Keys Created</p>
              <p className="text-[11px] text-muted-foreground">
                Generate your first key to connect Cursor, Windsurf, or Claude Desktop.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-8 items-center gap-1.5 px-4 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 cursor-pointer shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Generate Key</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => {
              const isSelected = k.id === selectedKeyId;
              const isVisible = Boolean(visibleKeys[k.id]);
              const isCopied = copiedKey === k.key;
              const maskedToken = `${k.key.substring(0, 10)}••••••••••••••••••••`;

              return (
                <div
                  key={k.id}
                  onClick={() => setSelectedKeyId(k.id)}
                  className={cn(
                    "rounded-2xl border p-4 transition-all cursor-pointer space-y-3 relative",
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-2xs"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40",
                    !k.isActive && "opacity-60"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "size-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Key className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-foreground">
                            {k.name}
                          </h3>
                          <span
                            className={cn(
                              "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                              k.isActive
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                : "bg-muted text-muted-foreground border-border/50"
                            )}
                          >
                            {k.isActive ? "Active" : "Paused"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{k.requestsCount} calls</span>
                          <span>•</span>
                          <span>
                            {k.lastUsedAt
                              ? `Active ${formatTimeAgo(k.lastUsedAt)}`
                              : "Never used"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0 self-end sm:self-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggle(k)}
                        className="size-7 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                        title={k.isActive ? "Pause key" : "Activate key"}
                      >
                        <Power
                          className={cn("size-3", k.isActive && "text-emerald-500")}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRegenerate(k)}
                        className="size-7 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                        title="Regenerate token"
                      >
                        <RefreshCw className="size-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(k)}
                        className="size-7 rounded-lg border border-border/60 hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete key"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>

                  {/* Token display row */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex-1 h-8 px-3 rounded-xl bg-card border border-border/60 flex items-center justify-between text-xs font-mono text-muted-foreground overflow-hidden">
                      <span className="truncate">
                        {isVisible ? k.key : maskedToken}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleTokenVisible(k.id)}
                        className="text-muted-foreground hover:text-foreground ml-2 shrink-0 cursor-pointer"
                        title={isVisible ? "Hide token" : "Reveal token"}
                      >
                        {isVisible ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyKeyString(k.key)}
                      className="h-8 px-3 rounded-xl bg-foreground text-background text-xs font-bold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      {isCopied ? (
                        <Check className="size-3 text-emerald-400" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>{isCopied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 1-Click IDE Configuration Generator ─── */}
      <div className="rounded-[32px] border border-border/60 bg-card p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Code2 className="size-4 text-primary" />
              <span>IDE &amp; Client Configuration Generator</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Select your IDE to generate ready-to-paste MCP configuration with your selected key (
              <span className="font-bold text-foreground">{activeKey?.name || "Active Key"}</span>
              ).
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyConfig}
            className="h-9 px-4 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            {copiedConfig ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copiedConfig ? "Copied" : "Copy Config Snippet"}</span>
          </button>
        </div>

        {/* Segmented IDE Switcher Tabs */}
        <div className="flex items-center p-1 rounded-full bg-muted/50 border border-border/50 gap-1 overflow-x-auto">
          {[
            { id: "cursor", label: "Cursor (.cursor/mcp.json)" },
            { id: "claude", label: "Claude Desktop" },
            { id: "windsurf", label: "Windsurf" },
            { id: "cline", label: "Cline / Roo Code" },
            { id: "curl", label: "cURL / Terminal" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sounds.tap();
                setActiveIdeTab(tab.id as any);
              }}
              className={cn(
                "py-1.5 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeIdeTab === tab.id
                  ? "bg-card text-foreground shadow-2xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Snippet Box */}
        <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 space-y-1">
          <pre className="text-zinc-300 whitespace-pre-wrap break-all leading-relaxed">
            {ideSnippets[activeIdeTab]}
          </pre>
        </div>

        {/* Setup Hints */}
        <div className="text-[11px] text-muted-foreground bg-muted/30 p-3 rounded-2xl border border-border/40 space-y-1">
          {activeIdeTab === "cursor" && (
            <p>
              Paste into your project&apos;s <code>.cursor/mcp.json</code> or add in{" "}
              <strong>Cursor Settings → Features → MCP → Add New MCP Server</strong> with Type: <code>HTTP</code>.
            </p>
          )}
          {activeIdeTab === "claude" && (
            <p>
              Add to <code>claude_desktop_config.json</code> under <code>mcpServers</code>. The <code>mcp-remote</code> bridge converts SSE to stdio seamlessly.
            </p>
          )}
          {activeIdeTab === "windsurf" && (
            <p>
              Add to <code>~/.codeium/windsurf/mcp_config.json</code> under <code>mcpServers</code>.
            </p>
          )}
          {activeIdeTab === "cline" && (
            <p>
              Add in Cline MCP Server Settings with transport <code>SSE</code> and the SSE endpoint URL.
            </p>
          )}
          {activeIdeTab === "curl" && (
            <p>
              Standard JSON-RPC 2.0 payload. Compatible with custom Python scripts, LangChain, CrewAI, and AutoGen.
            </p>
          )}
        </div>
      </div>

      {/* ─── Interactive Tool Catalog & Playground ─── */}
      <div className="rounded-[32px] border border-border/60 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Layers className="size-4" />
              </span>
              <h2 className="text-sm font-black text-foreground">
                CampusLoop Tool Directory &amp; Playground ({CAMPUSLOOP_MCP_TOOLS.length} Tools)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Every capability is executable by connected agents or testable in-browser right here.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools..."
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-full bg-muted/40 border border-border/60 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                selectedCategory === cat
                  ? "bg-foreground text-background shadow-2xs"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground"
              )}
            >
              {cat === "Exclusive AI & Intelligence" ? "✨ Exclusive AI" : cat}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTools.map((tool) => {
            const isExclusive = tool.category === "Exclusive AI & Intelligence";

            return (
              <div
                key={tool.name}
                className={cn(
                  "p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between",
                  isExclusive
                    ? "border-primary/40 bg-primary/5 hover:border-primary/70"
                    : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {tool.name}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border",
                        isExclusive
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border/50"
                      )}
                    >
                      {isExclusive ? "EXCLUSIVE" : tool.category.split(" ")[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[11px]">
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {Object.keys(tool.inputSchema.properties || {}).length} params
                  </span>

                  <button
                    type="button"
                    onClick={() => openPlaygroundForTool(tool)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Play className="size-3 fill-current" />
                    <span>Test Tool</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── In-Browser Tool Playground Modal ─── */}
      {activePlaygroundTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-xl rounded-[32px] border border-border/80 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Play className="size-4.5 fill-current" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-foreground font-mono">
                    {activePlaygroundTool}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Live execution via MCP server using key:{" "}
                    <span className="font-bold text-foreground">
                      {activeKey?.name || "Selected Key"}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePlaygroundTool(null)}
                className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Tool Arguments (JSON)
              </label>
              <textarea
                rows={5}
                value={toolArgsInput}
                onChange={(e) => setToolArgsInput(e.target.value)}
                className="w-full p-3 rounded-2xl bg-muted/30 border border-border/70 font-mono text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActivePlaygroundTool(null)}
                className="h-9 px-4 rounded-full border border-border/70 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecutePlaygroundTool}
                disabled={runningTool}
                className="h-9 px-5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {runningTool ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                <span>{runningTool ? "Executing..." : "Execute Tool"}</span>
              </button>
            </div>

            {/* Execution Output */}
            {toolExecutionResult && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Execution Result</span>
                  <div className="flex items-center gap-2">
                    {toolExecutionResult.latencyMs !== undefined && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {toolExecutionResult.latencyMs}ms
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                        toolExecutionResult.success
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/15 text-rose-500"
                      )}
                    >
                      {toolExecutionResult.success ? "SUCCESS" : "ERROR"}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-60">
                  <pre className="whitespace-pre-wrap break-all text-zinc-300">
                    {JSON.stringify(toolExecutionResult.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Create Key Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-md rounded-[32px] border border-border/80 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Key className="size-5" />
                </span>
                <h3 className="text-base font-black text-foreground">
                  New MCP API Key
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This secret key allows IDEs or agents to act on your behalf across your campus feed, notes vault, and communities.
            </p>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Key Name / Client Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cursor on MacBook, Claude Desktop, Personal Agent"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border/70 bg-muted/20 text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-10 px-4 rounded-full border border-border/70 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creating && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Generate Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
