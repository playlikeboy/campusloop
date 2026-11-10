import { vi } from "vitest";

/**
 * In-memory stand-in for the Drizzle client returned by `getDb()` from `@/db`.
 *
 * Unit tests must never reach a real Postgres (CI has no database, and local
 * runs must not read or write production data). Use it from a test file:
 *
 *   vi.mock("@/db", async () =>
 *     (await import("@/test/mock-db")).mockDbModule({
 *       tables: { gamingLobbies: [sampleLobby] },
 *       selectRows: [{ value: 1 }],
 *     }),
 *   );
 *
 * - `db.query.<table>.findMany()` resolves to `tables[table]` (or `[]`).
 * - `db.query.<table>.findFirst()` resolves to the first row (or `null`).
 * - `db.select(...)...` resolves to `selectRows` (default `[{ value: 0 }]`, the
 *   shape of a `count()` query).
 * - `db.insert(t).values(v).returning()` resolves to `[v]` (plus timestamps);
 *   `db.update(t).set(v)...returning()` resolves to `[v]`; `db.delete(...)`
 *   resolves to `[]`.
 *
 * Filters (`where`, `limit`, ...) are ignored: these tests cover route logic
 * and response shape, not SQL.
 */

type Row = Record<string, unknown>;

export type MockDbFixtures = {
  tables?: Record<string, Row[]>;
  selectRows?: Row[];
};

/** A chainable builder: every method returns itself; awaiting it yields `resolve()`. */
function chain(resolve: (state: { data?: unknown }) => unknown) {
  const state: { data?: unknown } = {};
  const proxy: unknown = new Proxy(() => {}, {
    get(_target, prop) {
      if (prop === "then" || prop === "catch" || prop === "finally") {
        const promise = Promise.resolve().then(() => resolve(state));
        return (promise[prop as "then"] as (...args: unknown[]) => unknown).bind(promise);
      }
      return (...args: unknown[]) => {
        if ((prop === "values" || prop === "set") && args[0] !== undefined) {
          state.data = args[0];
        }
        return proxy;
      };
    },
  });
  return proxy;
}

function withTimestamps(data: unknown): Row[] {
  const rows = Array.isArray(data) ? data : [data ?? {}];
  const now = new Date();
  return rows.map((row) => ({ createdAt: now, updatedAt: now, ...(row as Row) }));
}

export function createMockDb(fixtures: MockDbFixtures = {}) {
  const tables = fixtures.tables ?? {};
  const selectRows = fixtures.selectRows ?? [{ value: 0 }];

  const query = new Proxy(
    {},
    {
      get(_target, table) {
        const rows = () => tables[String(table)] ?? [];
        return {
          findMany: vi.fn(async () => rows()),
          findFirst: vi.fn(async () => rows()[0] ?? null),
        };
      },
    },
  );

  return {
    query,
    select: vi.fn(() => chain(() => selectRows)),
    selectDistinct: vi.fn(() => chain(() => selectRows)),
    insert: vi.fn(() => chain((s) => withTimestamps(s.data))),
    update: vi.fn(() => chain((s) => withTimestamps(s.data))),
    delete: vi.fn(() => chain(() => [])),
    execute: vi.fn(async () => ({ rows: [] })),
  };
}

/** Module shape for `vi.mock("@/db", ...)`. */
export async function mockDbModule(fixtures: MockDbFixtures = {}) {
  const db = createMockDb(fixtures);
  const schema = await import("@/db/schema");
  return {
    getDb: vi.fn(() => db),
    schema,
  };
}
