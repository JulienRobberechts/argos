import { checkFaithfulness } from "../../../src/application/responseChecks/strategies/faithfulness";
import type { ChunkSearchResult } from "../../../src/domain/ports/IChunkRepository";
import type { ILLMPort } from "../../../src/domain/ports/ILLMPort";

export async function scoreFaithfulness(
  llm: ILLMPort,
  question: string,
  ragAnswer: string,
  chunks: ChunkSearchResult[],
  titleById: Map<string, string>,
): Promise<number> {
  const result = await checkFaithfulness(
    llm,
    question,
    ragAnswer,
    chunks,
    titleById,
  );
  return result.score;
}
