import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { SentenceChunkingStrategy } from "./SentenceChunkingStrategy";

const CHUNK_SIZE = 100;
const CHUNK_OVERLAP = 40;

const strategy = new SentenceChunkingStrategy();

const documentText = readFileSync(
  join(
    __dirname,
    "../../../tests/DOCUMENTS/orient-express-1/orient-express-partie1.md",
  ),
  "utf-8",
);

// The document has 3 sentences:
// S1: "L'Orient-Express...européennes."          (~44 tokens)
// S2: "Dans les années 1920...apogée."           (~22 tokens)
// S3: "C'est après plusieurs...de masse."        (~69 tokens)
// Total: ~135 tokens → 2 chunks with size=100, overlap=40
// Chunk 0: S1+S2 (~66 tokens) | Chunk 1: S2+S3 (~91 tokens, S2 is the overlap)

describe("SentenceChunkingStrategy", () => {
  it("should return single chunk for short text", () => {
    const text = "L'Orient-Express est un train de luxe. Il fut créé en 1883.";
    const chunks = strategy.chunk(text, {
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text.trim());
    expect(chunks[0].metadata.position).toBe(0);
  });

  it("should return empty array for empty text", () => {
    expect(
      strategy.chunk("", {
        chunkSize: CHUNK_SIZE,
        chunkOverlap: CHUNK_OVERLAP,
      }),
    ).toEqual([]);
  });

  it("should never cut mid-sentence — each chunk ends at a sentence boundary", () => {
    const chunks = strategy.chunk(documentText, {
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    chunks.forEach((chunk) => {
      expect(chunk.content).toMatch(/[.!?]$/);
    });
  });

  it("should produce 2 chunks from the orient-express document (size=100, overlap=40)", () => {
    const chunks = strategy.chunk(documentText, {
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    expect(chunks).toHaveLength(2);
  });

  it("chunk 0 contains S1 and S2, chunk 1 contains S2 and S3 (S2 is the overlap)", () => {
    const chunks = strategy.chunk(documentText, {
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    // S2 appears in both chunks as the overlap sentence
    expect(chunks[0].content).toContain("Dans les années 1920");
    expect(chunks[1].content).toContain("Dans les années 1920");

    // S3 only in chunk 1
    expect(chunks[0].content).not.toContain("C'est après");
    expect(chunks[1].content).toContain("C'est après");
  });

  it("each chunk should fit within chunkSize tokens", () => {
    const chunks = strategy.chunk(documentText, {
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    chunks.forEach((chunk) => {
      const tokenCount = chunk.content.trim().split(/\s+/).length;
      expect(tokenCount).toBeLessThanOrEqual(CHUNK_SIZE);
    });
  });

  it("should preserve metadata: position, startChar, endChar", () => {
    const chunks = strategy.chunk(documentText, {
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    chunks.forEach((chunk, index) => {
      expect(chunk.metadata.position).toBe(index);
      const sliced = documentText
        .slice(chunk.metadata.startChar, chunk.metadata.endChar)
        .trim();
      expect(sliced).toBe(chunk.content);
    });
  });

  it("should handle overlap correctly with a controlled multi-sentence text", () => {
    const sentences = [
      "L'Orient-Express est un train de luxe créé en 1883.",
      "Il reliait Paris à Constantinople via Vienne.",
      "Dans les années 1920, son style atteignit son apogée.",
      "Le service Direct-Orient-Express cessa en 1977.",
      "Il fut vaincu par la concurrence de l'aviation.",
    ];
    const text = sentences.join(" ");

    // With size=20, overlap=10: every sentence (≤9 tokens) fits in the overlap
    const chunks = strategy.chunk(text, { chunkSize: 20, chunkOverlap: 10 });

    expect(chunks.length).toBeGreaterThan(1);
    for (let i = 0; i < chunks.length - 1; i++) {
      // The last sentence of chunk[i] should appear in chunk[i+1]
      const chunkSentences = chunks[i].content.split(/(?<=[.!?])\s+/);
      const lastSentence = chunkSentences[chunkSentences.length - 1];
      expect(chunks[i + 1].content).toContain(lastSentence);
    }
  });
});
