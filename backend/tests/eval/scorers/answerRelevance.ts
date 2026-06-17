import type { ILLMPort } from "../../../src/domain/ports/ILLMPort";
import type { ITextEncoder } from "../../../src/domain/ports/ITextEncoder";

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return dot / (norm(a) * norm(b));
}

export async function scoreAnswerRelevance(
  llm: ILLMPort,
  encoder: ITextEncoder,
  question: string,
  ragAnswer: string,
): Promise<number> {
  const prompt = `What question is this answer trying to answer? Reply ONLY with the question, nothing else.\nAnswer: "${ragAnswer}"`;
  const regeneratedQuestion = await llm.stream(prompt, () => {});

  const [originalEmbedding, regeneratedEmbedding] = await encoder.embedMany([
    question,
    regeneratedQuestion.trim(),
  ]);

  return cosineSimilarity(originalEmbedding, regeneratedEmbedding);
}
