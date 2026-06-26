import { afterAll, beforeAll, expect, it } from "vitest";
import type { ITextEncoder } from "../../../src/infra-ports/ai";

type Setup = { adapter: ITextEncoder; cleanup: () => Promise<void> };

export function testITextEncoderPort(setup: () => Setup): void {
  let adapter: ITextEncoder;
  let cleanup: () => Promise<void>;

  beforeAll(() => {
    const result = setup();
    adapter = result.adapter;
    cleanup = result.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  it("embed() returns a non-empty float vector", async () => {
    const vector = await adapter.embed("hello world");
    expect(Array.isArray(vector)).toBe(true);
    expect(vector.length).toBeGreaterThan(0);
    expect(vector.every((v) => typeof v === "number")).toBe(true);
  }, 30_000);

  it("embed() accepts document and query input types", async () => {
    const doc = await adapter.embed("test text", "document");
    const query = await adapter.embed("test text", "query");
    expect(doc.length).toBeGreaterThan(0);
    expect(query.length).toBeGreaterThan(0);
  }, 30_000);

  it("embedMany() returns one vector per input text", async () => {
    const vectors = await adapter.embedMany(["first", "second", "third"]);
    expect(vectors).toHaveLength(3);
  }, 30_000);

  it("embedMany() returns vectors of consistent dimension", async () => {
    const vectors = await adapter.embedMany(["a", "b", "c"]);
    const dim = vectors[0].length;
    expect(dim).toBeGreaterThan(0);
    for (const v of vectors) {
      expect(v.length).toBe(dim);
    }
  }, 30_000);
}
