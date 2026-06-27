import os from "node:os";
import path from "node:path";
import cookieParser from "cookie-parser";
import express from "express";
import { apiKeyAuth } from "../../../src/api/middleware/apiKeyAuth";
import { createErrorHandler } from "../../../src/api/middleware/errorHandler";
import { adminRouter } from "../../../src/api/routes/admin";
import { authRouter } from "../../../src/api/routes/auth";
import { configRouter } from "../../../src/api/routes/config";
import { conversationsRouter } from "../../../src/api/routes/conversations";
import { documentsRouter } from "../../../src/api/routes/documents";
import { searchRouter } from "../../../src/api/routes/search";
import { AppSettingsService } from "../../../src/app/admin/AppSettingsService";
import { CheckStorageConsistency } from "../../../src/app/admin/CheckStorageConsistency";
import { ResetAll } from "../../../src/app/admin/ResetAll";
import { CreateDocument } from "../../../src/app/knowledgeBase/CreateDocument";
import { DeleteDocument } from "../../../src/app/knowledgeBase/DeleteDocument";
import { DocumentQueries } from "../../../src/app/knowledgeBase/DocumentQueries";
import { IngestDocument } from "../../../src/app/knowledgeBase/IngestDocument";
import { SummarizeDocument } from "../../../src/app/knowledgeBase/SummarizeDocument";
import { AskQuestion } from "../../../src/app/rag/AskQuestion";
import { ConversationService } from "../../../src/app/rag/ConversationService";
import { ConversationTitleGenerator } from "../../../src/app/rag/ConversationTitleGenerator";
import { RetrieveKnowledge } from "../../../src/app/rag/RetrieveKnowledge";
import { CheckResponseGrounding } from "../../../src/app/rag/responseGrounding/CheckResponseGrounding";
import { SourceCitationResolver } from "../../../src/app/rag/SourceCitationResolver";
import config from "../../../src/config";
import { ConversationParams } from "../../../src/domain/entities";
import { PgAppSettingsRepository } from "../../../src/infra/persistence/db/PgAppSettingsRepository";
import { PgConversationRepository } from "../../../src/infra/persistence/db/PgConversationRepository";
import { PgDocumentRepository } from "../../../src/infra/persistence/db/PgDocumentRepository";
import { PgDocumentSummaryRepository } from "../../../src/infra/persistence/db/PgDocumentSummaryRepository";
import { PgVectorChunkRepository } from "../../../src/infra/persistence/db/PgVectorChunkRepository";
import { LocalFileStorage } from "../../../src/infra/storage/files/LocalFileStorage";
import { MultiFileParser } from "../../../src/infra/storage/parsers/MultiFileParser";
import { InMemoryEmbeddingAdapter } from "../../fakes/InMemoryEmbeddingAdapter";
import { InMemoryLLMAdapter } from "../../fakes/InMemoryLLMAdapter";
import { nullLogger } from "../../fakes/NullLogger";

/** Wires the full backend (real DB + real local file storage + InMemory AI fakes) for e2e-api tests.
 *  AI adapters use InMemory fakes to avoid external API calls during backend integration tests. */
export function makeTestApp() {
  const uploadDir = path.join(
    os.tmpdir(),
    `argos-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  // Real DB adapters
  const documentRepo = new PgDocumentRepository();
  const chunkRepo = new PgVectorChunkRepository();
  const summaryRepo = new PgDocumentSummaryRepository();
  const conversationRepo = new PgConversationRepository(
    ConversationParams.create({
      retrievalLimit: config.rag.defaults.retrievalLimit,
      retrievalMinScore: config.rag.defaults.retrievalMinScore,
      rerankEnabled: false,
      rerankModel: config.rerank.defaults.model,
      rerankCandidateMultiplier: config.rerank.defaults.candidateMultiplier,
      llmModel: config.llm.defaults.model,
      llmTemperature: config.llm.defaults.temperature,
      llmMaxTokens: config.llm.defaults.maxTokens,
      responseGroundingStrategies: [],
      searchMode: "vector",
    }),
  );
  const appSettingsRepo = new PgAppSettingsRepository();

  // Real local file storage (temp dir isolated per test run)
  const fileStorage = new LocalFileStorage(uploadDir);
  const fileParser = new MultiFileParser();

  // InMemory AI fakes — avoids Voyage/Anthropic calls
  const embeddingAdapter = new InMemoryEmbeddingAdapter();
  const llmAdapter = new InMemoryLLMAdapter();

  const appSettingsService = new AppSettingsService(appSettingsRepo, {
    storageBackend: "local",
    chunkingStrategy: config.rag.defaults.chunkingStrategy,
    chunkSize: config.rag.defaults.chunkSize,
    chunkOverlap: config.rag.defaults.chunkOverlap,
  });
  const createDocument = new CreateDocument(documentRepo, fileStorage);
  const ingestDocument = new IngestDocument(
    documentRepo,
    chunkRepo,
    embeddingAdapter,
    fileStorage,
    fileParser,
    () => appSettingsService.getChunkingConfig(),
    nullLogger,
  );
  const deleteDocument = new DeleteDocument(documentRepo, chunkRepo, fileStorage);
  const documentQueries = new DocumentQueries(documentRepo, chunkRepo, summaryRepo, fileStorage);
  const summarizeDocument = new SummarizeDocument(
    documentRepo,
    chunkRepo,
    summaryRepo,
    llmAdapter,
    nullLogger,
  );
  const retrieveKnowledge = new RetrieveKnowledge(
    chunkRepo,
    embeddingAdapter,
    nullLogger,
    null,
    3,
    "vector",
  );
  const responseGrounder = new CheckResponseGrounding(llmAdapter, nullLogger);
  const citationResolver = new SourceCitationResolver(documentRepo);
  const titleGenerator = new ConversationTitleGenerator(llmAdapter);
  const conversationService = new ConversationService(conversationRepo);
  const askQuestion = new AskQuestion(
    retrieveKnowledge,
    llmAdapter,
    conversationRepo,
    citationResolver,
    titleGenerator,
    nullLogger,
    responseGrounder,
  );
  const checkStorageConsistency = new CheckStorageConsistency(documentRepo, fileStorage);
  const resetAll = new ResetAll(
    fileStorage,
    (patch) => appSettingsService.updateSettings(patch),
    chunkRepo,
    summaryRepo,
    conversationRepo,
    documentRepo,
    nullLogger,
  );

  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/auth", authRouter());
  app.use("/api", apiKeyAuth);
  app.use("/api/config", configRouter(appSettingsService));
  app.use("/api/admin", adminRouter(checkStorageConsistency, appSettingsService, resetAll));
  app.use(
    "/api/documents",
    documentsRouter(
      {
        createDocument,
        ingestDocument,
        summarizeDocument,
        deleteDocument,
        documentQueries,
      },
      nullLogger,
    ),
  );
  app.use("/api/conversations", conversationsRouter(conversationService, askQuestion, nullLogger));
  app.use("/api/search", searchRouter(retrieveKnowledge));
  app.use(createErrorHandler(nullLogger));

  return { app, uploadDir };
}
