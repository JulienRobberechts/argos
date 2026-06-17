import { describe, expect, it } from "vitest";
import { scoreAnswerRelevance } from "./answerRelevance";

describe("scoreAnswerRelevance", () => {
  it("returns 1 when embeddings are identical (parallel vectors)", async () => {
    const llm = { stream: async () => "What is the capital of France?" };
    const encoder = {
      embed: async () => [1, 0, 0],
      embedMany: async () => [
        [1, 0, 0],
        [1, 0, 0],
      ],
    };
    const score = await scoreAnswerRelevance(
      llm,
      encoder,
      "What is the capital of France?",
      "Paris is the capital of France.",
    );
    expect(score).toBeCloseTo(1, 5);
  });

  it("returns 0 when embeddings are orthogonal", async () => {
    const llm = { stream: async () => "What is the weather today?" };
    const encoder = {
      embed: async () => [1, 0, 0],
      embedMany: async () => [
        [1, 0, 0],
        [0, 1, 0],
      ],
    };
    const score = await scoreAnswerRelevance(
      llm,
      encoder,
      "What is the capital of France?",
      "The weather is nice today.",
    );
    expect(score).toBeCloseTo(0, 5);
  });
});
