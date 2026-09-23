import { logMcpAudit } from "./auth";
import { MCP_TOOL_EXECUTORS } from "./tool-executors";
import { CAMPUSLOOP_MCP_TOOLS } from "./tools-catalog";
import type { JsonRpcRequest, JsonRpcResponse, McpContext } from "./types";

export const MCP_SERVER_INFO = {
  name: "campusloop-mcp",
  version: "1.0.0",
};

export const MCP_RESOURCES = [
  {
    uri: "campusloop://feed/latest",
    name: "Latest Campus Feed",
    description: "The most recent posts and announcements from your verified campus community.",
    mimeType: "application/json",
  },
  {
    uri: "campusloop://notes/popular",
    name: "Popular Academic Notes",
    description: "Top-rated study notes, PYQs, and question banks from your institution's vault.",
    mimeType: "application/json",
  },
  {
    uri: "campusloop://communities",
    name: "Joined Communities & Clubs",
    description: "Your active clubs, technical chapters, and campus student groups.",
    mimeType: "application/json",
  },
  {
    uri: "campusloop://me",
    name: "My Student Profile & Clout",
    description: "Your verified student details, college, LP clout balance, and permissions.",
    mimeType: "application/json",
  },
];

export const MCP_PROMPTS = [
  {
    name: "campus_exam_cram",
    description: "Generate a targeted revision roadmap and study plan using verified notes from your college's vault.",
    arguments: [
      { name: "subject", description: "Subject or course code (e.g. Operating Systems, CS201)", required: true },
      { name: "hoursLeft", description: "Hours remaining until the exam", required: false },
    ],
  },
  {
    name: "campus_gossip_digest",
    description: "Synthesize the freshest campus confessions, buzz, and hostel chatter from the last 24-48 hours.",
    arguments: [],
  },
  {
    name: "doxx_shield_preflight",
    description: "Audit any draft post or announcement for phone numbers, room numbers, or accidental private data.",
    arguments: [
      { name: "content", description: "Draft text to audit", required: true },
    ],
  },
];

export async function handleMcpJsonRpc(
  request: JsonRpcRequest,
  context: McpContext
): Promise<JsonRpcResponse> {
  const { id = null, method, params = {} } = request;

  try {
    switch (method) {
      case "initialize": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false, listChanged: false },
              prompts: { listChanged: false },
            },
            serverInfo: MCP_SERVER_INFO,
            instructions: `You are connected to CampusLoop as student ${context.user.displayName} (@${context.user.username}) at ${context.institutionName}. You can read and publish to the campus feed, interact with communities, search the verified notes vault, send direct messages, and run exclusive campus intelligence tools.`,
          },
        };
      }

      case "ping": {
        return { jsonrpc: "2.0", id, result: {} };
      }

      case "tools/list": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: CAMPUSLOOP_MCP_TOOLS.map((t) => ({
              name: t.name,
              description: `[${t.category}] ${t.description}`,
              inputSchema: t.inputSchema,
            })),
          },
        };
      }

      case "tools/call": {
        const toolName = String(params.name || "").trim();
        const args = (params.arguments as Record<string, any>) || {};

        if (!toolName) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: "Missing tool name in params" },
          };
        }

        const executor = MCP_TOOL_EXECUTORS[toolName];
        if (!executor) {
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Unknown tool '${toolName}'. Available tools can be listed via tools/list`,
            },
          };
        }

        const startTime = Date.now();
        try {
          const result = await executor(context, args);
          const latencyMs = Date.now() - startTime;
          await logMcpAudit(context, toolName, "SUCCESS", latencyMs);

          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
                },
              ],
              isError: false,
            },
          };
        } catch (err: any) {
          const latencyMs = Date.now() - startTime;
          const errorMsg = err?.message || "Tool execution failed";
          await logMcpAudit(context, toolName, "ERROR", latencyMs, errorMsg);

          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ error: errorMsg }, null, 2),
                },
              ],
              isError: true,
            },
          };
        }
      }

      case "resources/list": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            resources: MCP_RESOURCES,
          },
        };
      }

      case "resources/read": {
        const uri = String(params.uri || "").trim();
        let content = "";

        if (uri === "campusloop://feed/latest") {
          const feed = await MCP_TOOL_EXECUTORS.campusloop_get_feed(context, { limit: 10 });
          content = JSON.stringify(feed, null, 2);
        } else if (uri === "campusloop://notes/popular") {
          const notes = await MCP_TOOL_EXECUTORS.campusloop_search_academic_notes(context, { query: "", limit: 10 });
          content = JSON.stringify(notes, null, 2);
        } else if (uri === "campusloop://communities") {
          const comms = await MCP_TOOL_EXECUTORS.campusloop_list_communities(context, { filter: "JOINED" });
          content = JSON.stringify(comms, null, 2);
        } else if (uri === "campusloop://me") {
          const me = await MCP_TOOL_EXECUTORS.campusloop_get_my_profile(context, {});
          content = JSON.stringify(me, null, 2);
        } else {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: `Resource URI '${uri}' not recognized.` },
          };
        }

        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: content,
              },
            ],
          },
        };
      }

      case "prompts/list": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            prompts: MCP_PROMPTS,
          },
        };
      }

      case "prompts/get": {
        const promptName = String(params.name || "").trim();
        const promptArgs = (params.arguments as Record<string, string>) || {};

        if (promptName === "campus_exam_cram") {
          const subject = promptArgs.subject || "General Engineering";
          return {
            jsonrpc: "2.0",
            id,
            result: {
              description: `Exam cram plan for ${subject}`,
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: `I have an upcoming exam on ${subject}. Please search my campus academic vault for top notes, identify the core questions, and create a 3-step high-yield study plan.`,
                  },
                },
              ],
            },
          };
        } else if (promptName === "campus_gossip_digest") {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              description: "Latest campus digest",
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: "Summarize today's top campus discussions, confessions, and student polls from my college feed.",
                  },
                },
              ],
            },
          };
        } else if (promptName === "doxx_shield_preflight") {
          const content = promptArgs.content || "";
          return {
            jsonrpc: "2.0",
            id,
            result: {
              description: "Safety audit",
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: `Audit this draft post before I share it on CampusLoop: "${content}". Check for private phone numbers, room numbers, or safety violations.`,
                  },
                },
              ],
            },
          };
        }

        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unknown prompt '${promptName}'` },
        };
      }

      default: {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Method '${method}' not found. Supported: initialize, ping, tools/list, tools/call, resources/list, resources/read, prompts/list, prompts/get`,
          },
        };
      }
    }
  } catch (err: any) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message: err?.message || "Internal JSON-RPC Error",
      },
    };
  }
}
