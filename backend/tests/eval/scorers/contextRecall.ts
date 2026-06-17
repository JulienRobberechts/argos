import { extractJSON } from "../../../src/application/responseChecks/strategies/extractJSON";
import type { ChunkSearchResult } from "../../../src/domain/ports/IChunkRepository";
import type { ILLMPort } from "../../../src/domain/ports/ILLMPort";

export async function scoreContextRecall(
  llm: ILLMPort,
  expectedAnswer: string,
  chunks: ChunkSearchResult[],
): Promise<number> {
  const decomposePrompt = [
    `Décompose cette réponse en affirmations atomiques (faits individuels).`,
    `Réponds UNIQUEMENT avec du JSON : {"claims": ["affirmation 1", "affirmation 2", ...]}`,
    `Réponse : "${expectedAnswer}"`,
  ].join("\n");

  const rawClaims = await llm.stream(decomposePrompt, () => {}, undefined, {
    maxTokens: 2048,
  });
  const { claims } = extractJSON(rawClaims) as { claims: string[] };

  if (claims.length === 0) return 1;

  const chunksText = chunks.map((c) => c.chunk.content).join("\n---\n");
  let coveredCount = 0;

  for (const claim of claims) {
    const coveragePrompt = [
      `Est-ce que l'affirmation suivante est couverte par au moins un des extraits ci-dessous ?`,
      `Affirmation : "${claim}"`,
      `Extraits :`,
      chunksText,
      `Réponds UNIQUEMENT avec du JSON : {"covered": true}`,
    ].join("\n");

    const rawCoverage = await llm.stream(coveragePrompt, () => {}, undefined, {
      maxTokens: 256,
    });
    const { covered } = extractJSON(rawCoverage) as { covered: boolean };
    if (covered) coveredCount++;
  }

  return coveredCount / claims.length;
}
