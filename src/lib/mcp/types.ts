import type { userProfiles } from "@/db/schema";

export type UserProfileRecord = typeof userProfiles.$inferSelect;

export type McpPermission = "read" | "write" | "chat" | "exclusive";

export interface McpContext {
  userId: string;
  keyId: string;
  user: UserProfileRecord;
  institutionId: string;
  institutionName: string;
  permissions: string[];
  clientInfo?: string | null;
}

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, any>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface McpToolProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: McpToolProperty;
  minimum?: number;
  maximum?: number;
  default?: any;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  category:
    | "Feed & Posts"
    | "Direct Messaging"
    | "Communities & Clubs"
    | "Academics & Vault"
    | "Colleges & Campuses"
    | "Profile & Loop Points"
    | "Stories & Vibes"
    | "Exclusive AI & Intelligence";
  inputSchema: {
    type: "object";
    properties: Record<string, McpToolProperty>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface McpResourceDefinition {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpPromptDefinition {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface McpToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
