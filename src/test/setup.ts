import { vi } from "vitest";

// `@hexclave/next` imports `next/navigation` from inside pnpm's isolated store,
// which Vitest cannot resolve. No test needs the real SDK, so the server app is
// replaced globally with a stub whose `getUser` resolves to null (signed out).
// A test file's own `vi.mock("@/hexclave/server", ...)` still takes precedence.
vi.mock("@/hexclave/server", () => ({
  hexclaveServerApp: {
    getUser: vi.fn(async () => null),
  },
}));

vi.mock("server-only", () => ({}));
