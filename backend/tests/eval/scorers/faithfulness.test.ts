import { describe, expect, it } from "vitest";
import type { ChunkSearchResult } from "../../../src/domain/ports/IChunkRepository";
import { scoreFaithfulness } from "./faithfulness";

function makeChunk(content: string): ChunkSearchResult {
  return {
    chunk: {
      id: "chunk-1",
      documentId: "doc-1",
      content,
      embedding: [],
      metadata: { position: 0, startChar: 0, endChar: content.length },
    },
    score: 0.9,
  };
}

describe("scoreFaithfulness", () => {
  it("returns 1 when all claims are supported", async () => {
    const llm = {
      stream: async () =>
        JSON.stringify({
          claims: [
            {
              claim: "Paris is the capital",
              status: "SUPPORTED",
              sourceExcerpt: "Paris",
            },
            {
              claim: "France is in Europe",
              status: "SUPPORTED",
              sourceExcerpt: "Europe",
            },
          ],
        }),
    };
    const score = await scoreFaithfulness(
      llm,
      "What is the capital of France?",
      "Paris is the capital of France, located in Europe.",
      [makeChunk("Paris is the capital of France, located in Europe.")],
      new Map([["doc-1", "Test Doc"]]),
    );
    expect(score).toBe(1);
  });

  it("returns 0 when all claims are unsupported", async () => {
    const llm = {
      stream: async () =>
        JSON.stringify({
          claims: [
            {
              claim: "The sky is green",
              status: "UNSUPPORTED",
              sourceExcerpt: null,
            },
          ],
        }),
    };
    const score = await scoreFaithfulness(
      llm,
      "What color is the sky?",
      "The sky is green.",
      [makeChunk("The sky is blue.")],
      new Map(),
    );
    expect(score).toBe(0);
  });

  it("returns partial score when some claims are supported", async () => {
    const llm = {
      stream: async () =>
        JSON.stringify({
          claims: [
            { claim: "Claim 1", status: "SUPPORTED", sourceExcerpt: "claim" },
            { claim: "Claim 2", status: "UNSUPPORTED", sourceExcerpt: null },
          ],
        }),
    };
    const score = await scoreFaithfulness(
      llm,
      "question",
      "answer",
      [makeChunk("claim 1")],
      new Map(),
    );
    expect(score).toBe(0.5);
  });
});
