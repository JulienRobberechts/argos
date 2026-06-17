import { describe, expect, it, vi } from "vitest";
import type { ChunkSearchResult } from "../../../src/domain/ports/IChunkRepository";
import { scoreContextRecall } from "./contextRecall";

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

describe("scoreContextRecall", () => {
  it("returns 1 when all claims are covered", async () => {
    const llm = {
      stream: vi
        .fn()
        .mockResolvedValueOnce('{"claims": ["claim A", "claim B"]}')
        .mockResolvedValueOnce('{"covered": true}')
        .mockResolvedValueOnce('{"covered": true}'),
    };
    const score = await scoreContextRecall(llm, "expected answer", [
      makeChunk("content covering A and B"),
    ]);
    expect(score).toBe(1);
  });

  it("returns 0 when no claims are covered", async () => {
    const llm = {
      stream: vi
        .fn()
        .mockResolvedValueOnce('{"claims": ["claim A", "claim B"]}')
        .mockResolvedValueOnce('{"covered": false}')
        .mockResolvedValueOnce('{"covered": false}'),
    };
    const score = await scoreContextRecall(llm, "expected answer", [
      makeChunk("unrelated content"),
    ]);
    expect(score).toBe(0);
  });

  it("returns partial score when some claims are covered", async () => {
    const llm = {
      stream: vi
        .fn()
        .mockResolvedValueOnce('{"claims": ["A", "B", "C", "D"]}')
        .mockResolvedValueOnce('{"covered": true}')
        .mockResolvedValueOnce('{"covered": false}')
        .mockResolvedValueOnce('{"covered": true}')
        .mockResolvedValueOnce('{"covered": false}'),
    };
    const score = await scoreContextRecall(llm, "expected answer", [
      makeChunk("some content"),
    ]);
    expect(score).toBe(0.5);
  });

  it("returns 1 when there are no claims", async () => {
    const llm = {
      stream: vi.fn().mockResolvedValueOnce('{"claims": []}'),
    };
    const score = await scoreContextRecall(llm, "", [makeChunk("content")]);
    expect(score).toBe(1);
  });
});
