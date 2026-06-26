import { afterAll, beforeAll, expect, it } from "vitest";
import type { IRerankPort } from "../../../src/infra-ports/ai";

type Setup = { adapter: IRerankPort; cleanup: () => Promise<void> };

export function testIRerankPort(setup: () => Setup): void {
  let adapter: IRerankPort;
  let cleanup: () => Promise<void>;

  beforeAll(() => {
    const result = setup();
    adapter = result.adapter;
    cleanup = result.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  it("rerank() returns one index per document", async () => {
    const result = await adapter.rerank("query", ["doc A", "doc B", "doc C"]);
    expect(result).toHaveLength(3);
  }, 30_000);

  it("rerank() returns a valid permutation of document indices", async () => {
    const result = await adapter.rerank("some query", ["x", "y", "z"]);
    expect([...result].sort((a, b) => a - b)).toEqual([0, 1, 2]);
  }, 30_000);
}
