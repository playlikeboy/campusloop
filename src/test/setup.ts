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

// Unit tests must never reach a live database (CI has none, and local runs must
// not read production data). `vitest.config.ts` loads `.env`, so drop the DB
// URLs here: any test that forgets to mock `@/db` fails loudly with
// "Missing DATABASE_URL" instead of silently querying production.
// Mock it with `vi.mock("@/db", ...)` and the helper in `src/test/mock-db.ts`.
delete process.env.DATABASE_URL;
delete process.env.DB_URL;
