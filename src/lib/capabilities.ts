/**
 * Legacy capability names, still used for the signed-out "Sign in to like"
 * style prompts (see src/components/preview/preview-locked-modal.tsx).
 * Signed-in permissions live in src/lib/trust.ts and are enforced on the
 * server by `requireCapability` in src/lib/trust-server.ts.
 */
export type UserCapability =
  | "READ_PUBLIC_CONTENT"
  | "SAVE_POST"
  | "LIKE_POST"
  | "COMMENT_POST"
  | "CREATE_POST"
  | "JOIN_COMMUNITY"
  | "SEND_MESSAGE"
  | "CAMPUS_MATCH"
  | "SECRET_CRUSH"
  | "ANONYMOUS_POST"
  | "MARKETPLACE_ORDER";
