import type { KnowledgeCheckResult, KnowledgeClaim } from "../../../domain/entities/Message";
import type { ChunkSearchResult } from "../../../domain/ports/IChunkRepository";
import type { ILLMPort } from "../../../domain/ports/ILLMPort";
import { Logger } from "../../../infrastructure/logger/Logger";
import { extractJSON } from "./extractJSON";

const logger = new Logger("faithfulness");

export async function checkFaithfulness(
  llm: ILLMPort,
  query: string,
  answer: string,
  chunks: ChunkSearchResult[],
  titleById: Map<string, string>,
): Promise<KnowledgeCheckResult> {
  const sourcesText = chunks.map((c) => c.chunk.content).join("\n---\n");
  const prompt = [
    `Question: "${query}"`,
    "",
    "Sources provided:",
    sourcesText,
    "",
    `Answer to evaluate: "${answer}"`,
    "",
    "For each factual claim in the answer, indicate whether it is explicitly supported by the sources above.",
    "Reply ONLY with valid JSON in this exact format:",
    '{"claims": [{"claim": "...", "status": "SUPPORTED|UNSUPPORTED", "sourceExcerpt": "exact quote or null"}]}',
  ].join("\n");

  logger.info("Faithfulness check starting", {
    query,
    answerLength: answer.length,
    chunkCount: chunks.length,
    promptLength: prompt.length,
  });

  const raw = await llm.stream(prompt, () => {}, undefined, {
    maxTokens: 4096,
  });

  logger.info("Faithfulness raw LLM response", {
    responseLength: raw.length,
    endsWithBrace: raw.trimEnd().endsWith("}"),
    tail: raw.slice(-200),
  });

  if (!raw.trimEnd().endsWith("}")) {
    logger.warn("Faithfulness response appears truncated (does not end with '}')", {
      last50chars: JSON.stringify(raw.slice(-50)),
    });
  }

  const parsed = extractJSON(raw) as {
    claims: Array<{
      claim: string;
      status: string;
      sourceExcerpt?: string | null;
    }>;
  };

  const claims: KnowledgeClaim[] = parsed.claims.map((c) => {
    const excerpt = c.sourceExcerpt ?? undefined;
    let documentId: string | undefined;
    let documentTitle: string | undefined;
    if (excerpt) {
      const needle = excerpt.slice(0, 60).toLowerCase();
      const matched = chunks.find((ch) => ch.chunk.content.toLowerCase().includes(needle));
      if (matched) {
        documentId = matched.chunk.documentId;
        documentTitle = titleById.get(documentId) ?? documentId;
      }
    }
    return {
      claim: c.claim,
      status: c.status === "SUPPORTED" ? "SUPPORTED" : "UNSUPPORTED",
      sourceExcerpt: excerpt,
      documentId,
      documentTitle,
    };
  });

  const supported = claims.filter((c) => c.status === "SUPPORTED").length;
  const score = claims.length > 0 ? supported / claims.length : 1;

  return {
    strategy: "faithfulness",
    score,
    claims,
    warning: score < 1 ? "Some claims are not grounded in the retrieved documents" : undefined,
  };
}
