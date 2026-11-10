export type IdeId = "cursor" | "claude" | "windsurf" | "cline" | "curl";

export const IDE_TABS: { id: IdeId; label: string }[] = [
  { id: "cursor", label: "Cursor" },
  { id: "claude", label: "Claude Desktop" },
  { id: "windsurf", label: "Windsurf" },
  { id: "cline", label: "Cline / Roo Code" },
  { id: "curl", label: "cURL" },
];

/** Ready-to-paste MCP config for each client, filled with the chosen key. */
export function buildIdeSnippets(origin: string, token: string): Record<IdeId, string> {
  const httpEndpoint = `${origin}/api/mcp`;
  const sseEndpoint = `${origin}/api/mcp/sse`;
  const authorization = `Bearer ${token}`;
  const json = (v: unknown) => JSON.stringify(v, null, 2);
  return {
    cursor: json({
      mcpServers: { campusloop: { url: httpEndpoint, headers: { Authorization: authorization } } },
    }),
    claude: json({
      mcpServers: {
        campusloop: {
          command: "npx",
          args: ["-y", "mcp-remote", sseEndpoint, "--header", `Authorization: ${authorization}`],
        },
      },
    }),
    windsurf: json({
      mcpServers: { campusloop: { serverUrl: httpEndpoint, headers: { Authorization: authorization } } },
    }),
    cline: json({
      mcpServers: {
        campusloop: { url: sseEndpoint, transport: "sse", headers: { Authorization: authorization } },
      },
    }),
    curl: `curl -X POST "${httpEndpoint}" \\
  -H "Authorization: ${authorization}" \\
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
}
