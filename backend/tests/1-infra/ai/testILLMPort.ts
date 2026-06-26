import { afterAll, beforeAll, expect, it } from "vitest";
import type { ILLMPort } from "../../../src/infra-ports/ai";

type Setup = { adapter: ILLMPort; cleanup: () => Promise<void> };

export function testILLMPort(setup: () => Setup): void {
  let adapter: ILLMPort;
  let cleanup: () => Promise<void>;

  beforeAll(() => {
    const result = setup();
    adapter = result.adapter;
    cleanup = result.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  it("stream() calls onToken at least once and returns assembled content", async () => {
    const tokens: string[] = [];
    const result = await adapter.stream("Reply with the word 'ok'.", (t) => tokens.push(t));
    expect(tokens.length).toBeGreaterThan(0);
    expect(result).toBe(tokens.join(""));
    expect(result.length).toBeGreaterThan(0);
  }, 30_000);
}
