import { Router } from "express";
import config from "../../config";

export function configRouter(): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({
      logLevel: config.server.logLevel,
      rag: {
        chunkingStrategy: config.rag.chunkingStrategy,
        chunkSize: config.rag.chunkSize,
        chunkOverlap: config.rag.chunkOverlap,
        retrievalLimit: config.rag.retrievalLimit,
        retrievalMinScore: config.rag.retrievalMinScore,
      },
      llm: {
        maxTokens: config.llm.anthropic.maxTokens,
        temperature: config.llm.anthropic.temperature,
      },
    });
  });

  return router;
}
