import { describe, expect, it } from "vitest";
import {
  bucketCounts,
  findNearDuplicates,
  jaccard,
  primaryKeyword,
  shingles,
  type TriageInput,
  toCsv,
  triageArticles,
} from "./triage";

const filler = (seed: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${seed}${i % 97} topic${(i * 7) % 89} detail${(i * 13) % 83}`).join(" ");

function article(over: Partial<TriageInput> & { slug: string }): TriageInput {
  return {
    id: over.slug,
    title: over.slug.replace(/-/g, " "),
    content: `**Direct answer: yes.** ${filler(over.slug, 400)} [src](https://example.org/a) [src2](https://example.org/b)`,
    category: "DSA",
    linkCount: 0,
    ...over,
  };
}

describe("shingles and jaccard", () => {
  it("identical text scores 1, disjoint text scores 0", () => {
    const a = shingles("the quick brown fox jumps over the lazy dog");
    expect(jaccard(a, a)).toBe(1);
    expect(jaccard(a, shingles("completely different words in this other sentence here"))).toBe(0);
  });

  it("finds near-duplicate pairs through the index", () => {
    const base = filler("x", 120);
    const docs = [
      { slug: "a", shingles: shingles(base) },
      { slug: "b", shingles: shingles(`${base} one extra ending`) },
      { slug: "c", shingles: shingles(filler("zzz", 120)) },
    ];
    const pairs = findNearDuplicates(docs);
    expect(pairs).toHaveLength(1);
    expect([pairs[0].a, pairs[0].b].sort()).toEqual(["a", "b"]);
  });
});

describe("primaryKeyword", () => {
  it("ignores stopwords, years and word order", () => {
    expect(primaryKeyword("How to Prepare for GATE 2027: A Guide")).toBe(primaryKeyword("GATE prepare: tips"));
  });
});

describe("triageArticles", () => {
  it("merges an exact duplicate into the stronger copy", () => {
    const body = `**Direct answer: yes.** ${filler("same", 400)} [s](https://e.org/1) [t](https://e.org/2)`;
    const rows = triageArticles([
      article({ slug: "fellowship-guide-a1", title: "Soros Fellowship Guide", content: body, impressions: 50 }),
      article({ slug: "fellowship-guide-b2", title: "Soros Fellowship Guide", content: body }),
    ]);
    const loser = rows.find((r) => r.slug === "fellowship-guide-b2")!;
    expect(loser.bucket).toBe("merge");
    expect(loser.mergeTarget).toBe("fellowship-guide-a1");
    expect(rows.find((r) => r.slug === "fellowship-guide-a1")!.bucket).toBe("keep");
  });

  it("does not merge templated pages about different topics", () => {
    const tail = filler("tmpl", 400);
    const rows = triageArticles([
      article({ slug: "upsc-maths", title: "UPSC Mathematics Optional 2027: The Syllabus", content: `**Direct answer.** ${tail}` }),
      article({ slug: "upsc-law", title: "UPSC Law Optional 2027: The Syllabus", content: `**Direct answer.** ${tail}` }),
    ]);
    const flagged = rows.find((r) => r.duplicateOf)!;
    expect(flagged.templated).toBe(true);
    expect(flagged.bucket).toBe("improve");
    expect(flagged.mergeTarget).toBeNull();
  });

  it("noindexes thin pages and unsourced health pages, keeps proven ones", () => {
    const rows = triageArticles([
      article({ slug: "thin", content: "Direct answer: tiny page." }),
      article({ slug: "health", category: "HEALTH", content: `Direct answer. ${filler("h", 400)}` }),
      article({ slug: "thin-but-ranks", content: "short", impressions: 500 }),
      article({ slug: "solid" }),
    ]);
    const by = Object.fromEntries(rows.map((r) => [r.slug, r.bucket]));
    expect(by).toEqual({ thin: "noindex", health: "noindex", "thin-but-ranks": "keep", solid: "keep" });
    expect(bucketCounts(rows)).toEqual({ keep: 2, improve: 0, merge: 0, noindex: 2 });
  });

  it("writes a CSV with a header and quoted titles", () => {
    const csv = toCsv(triageArticles([article({ slug: "a", title: 'Comma, "quote"' })]));
    expect(csv.split("\n")[0]).toMatch(/^bucket,slug,merge_target,title/);
    expect(csv).toContain('"Comma, ""quote"""');
  });
});
