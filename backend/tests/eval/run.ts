import "dotenv/config";

import { AnthropicLLMAdapter } from "../../src/infrastructure/llm/AnthropicLLMAdapter";
import { VoyageEmbeddingAdapter } from "../../src/infrastructure/embeddings/VoyageEmbeddingAdapter";
import { PgVectorChunkRepository } from "../../src/infrastructure/db/PgVectorChunkRepository";
import pool from "../../src/infrastructure/db/pool";
import { SearchKnowledge } from "../../src/application/SearchKnowledge";
import type { ChunkSearchResult } from "../../src/domain/ports/IChunkRepository";
import { scoreFaithfulness } from "./scorers/faithfulness";
import { scoreAnswerRelevance } from "./scorers/answerRelevance";
import { scoreContextRecall } from "./scorers/contextRecall";
import datasetRaw from "./dataset.json";

interface EvalEntry {
  id: string;
  dataset: string;
  difficulty: string;
  question: string;
  expected_answer: string;
  document_ids: string[];
}

interface EvalResult {
  id: string;
  dataset: string;
  difficulty: string;
  faithfulness: number;
  answerRelevance: number;
  contextRecall: number;
}

function buildRagPrompt(question: string, chunks: ChunkSearchResult[]): string {
  const sourcesText = chunks
    .map((r, i) => `SOURCE ${i + 1}:\n${r.chunk.content}`)
    .join("\n\n");
  return [
    "You are a helpful assistant. Answer based only on the provided sources.",
    "",
    "SOURCES:",
    sourcesText,
    "",
    `User: ${question}`,
  ].join("\n");
}

function fmt(n: number): string {
  return Number.isNaN(n) ? " ERR" : n.toFixed(2);
}

function pad(s: string, w: number): string {
  return s.slice(0, w).padEnd(w);
}

function printTable(results: EvalResult[]): void {
  const header = `${"ID".padEnd(10)}${"Dataset".padEnd(18)}${"Diff".padEnd(8)}${"Faith".padEnd(7)}${"Relev".padEnd(7)}Recall`;
  console.log(header);
  console.log("─".repeat(57));

  for (const r of results) {
    console.log(
      `${pad(r.id, 10)}${pad(r.dataset, 18)}${pad(r.difficulty, 8)}${fmt(r.faithfulness).padEnd(7)}${fmt(r.answerRelevance).padEnd(7)}${fmt(r.contextRecall)}`,
    );
  }

  console.log("─".repeat(57));

  const validAvg = (vals: number[]) => {
    const v = vals.filter((n) => !Number.isNaN(n));
    return v.length > 0 ? v.reduce((a, b) => a + b, 0) / v.length : Number.NaN;
  };

  const avgFaith = validAvg(results.map((r) => r.faithfulness));
  const avgRelev = validAvg(results.map((r) => r.answerRelevance));
  const avgRecall = validAvg(results.map((r) => r.contextRecall));

  console.log(
    `${"Moyenne".padEnd(36)}${fmt(avgFaith).padEnd(7)}${fmt(avgRelev).padEnd(7)}${fmt(avgRecall)}`,
  );
}

async function main() {
  for (const key of ["ANTHROPIC_API_KEY", "VOYAGE_API_KEY", "DATABASE_URL"]) {
    if (!process.env[key]) {
      console.error(`Missing required env var: ${key}`);
      process.exit(1);
    }
  }

  const llm = new AnthropicLLMAdapter();
  const encoder = new VoyageEmbeddingAdapter();
  const chunkRepo = new PgVectorChunkRepository();
  const searchKnowledge = new SearchKnowledge(
    chunkRepo,
    encoder,
    null,
    3,
    "hybrid",
  );

  const dataset = datasetRaw as EvalEntry[];
  const results: EvalResult[] = [];

  for (const entry of dataset) {
    process.stderr.write(`Evaluating ${entry.id} (${entry.difficulty})...\n`);

    try {
      const chunks = await searchKnowledge.execute(entry.question);

      const titleById = new Map<string, string>(
        chunks.map((c) => [c.chunk.documentId, c.chunk.documentId]),
      );

      const ragAnswer = await llm.stream(
        buildRagPrompt(entry.question, chunks),
        () => {},
        undefined,
        {
          systemPrompt:
            "Always respond in the same language as the user's question.",
        },
      );

      const [faithfulness, answerRelevance, contextRecall] = await Promise.all([
        scoreFaithfulness(llm, entry.question, ragAnswer, chunks, titleById),
        scoreAnswerRelevance(llm, encoder, entry.question, ragAnswer),
        scoreContextRecall(llm, entry.expected_answer, chunks),
      ]);

      results.push({
        id: entry.id,
        dataset: entry.dataset,
        difficulty: entry.difficulty,
        faithfulness,
        answerRelevance,
        contextRecall,
      });
    } catch (err) {
      process.stderr.write(`Error evaluating ${entry.id}: ${err}\n`);
      results.push({
        id: entry.id,
        dataset: entry.dataset,
        difficulty: entry.difficulty,
        faithfulness: Number.NaN,
        answerRelevance: Number.NaN,
        contextRecall: Number.NaN,
      });
    }
  }

  console.log("");
  printTable(results);

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
