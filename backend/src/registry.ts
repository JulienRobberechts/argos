import { AppSettingsService } from "./application/AppSettingsService";
import { AskQuestion } from "./application/AskQuestion";
import { CheckStorageConsistency } from "./application/CheckStorageConsistency";
import { CreateDocument } from "./application/CreateDocument";
import { GenerateQuiz } from "./application/GenerateQuiz";
import { IngestDocument } from "./application/IngestDocument";
import { ResetAll } from "./application/ResetAll";
import { CheckContextualKnowledge } from "./application/responseChecks/CheckContextualKnowledge";
import { SearchKnowledge } from "./application/SearchKnowledge";
import { SummarizeDocument } from "./application/SummarizeDocument";
import config from "./config";
import { PgAppSettingsRepository } from "./infrastructure/db/PgAppSettingsRepository";
import { PgConversationRepository } from "./infrastructure/db/PgConversationRepository";
import { PgDocumentRepository } from "./infrastructure/db/PgDocumentRepository";
import { PgDocumentSummaryRepository } from "./infrastructure/db/PgDocumentSummaryRepository";
import { PgVectorChunkRepository } from "./infrastructure/db/PgVectorChunkRepository";
import { VoyageEmbeddingAdapter } from "./infrastructure/embeddings/VoyageEmbeddingAdapter";
import { Logger } from "./infrastructure/logger/Logger";
import { AnthropicLLMAdapter } from "./infrastructure/llm/AnthropicLLMAdapter";
import { MultiFileParser } from "./infrastructure/parsers/MultiFileParser";
import { VoyageRerankAdapter } from "./infrastructure/reranking/VoyageRerankAdapter";
import { createStorageBackends } from "./infrastructure/storage/createFileStorage";
import { DynamicFileStorage } from "./infrastructure/storage/DynamicFileStorage";

export const documentRepo = new PgDocumentRepository();
export const chunkRepo = new PgVectorChunkRepository();
export const conversationRepo = new PgConversationRepository({
  retrievalLimit: config.rag.retrievalLimit,
  retrievalMinScore: config.rag.retrievalMinScore,
  rerankEnabled: config.rerank.enabled,
  rerankModel: config.rerank.model,
  rerankCandidateMultiplier: config.rerank.candidateMultiplier,
  llmModel: config.llm.anthropic.model,
  llmTemperature: config.llm.anthropic.temperature,
  llmMaxTokens: config.llm.anthropic.maxTokens,
  knowledgeCheckStrategies: config.rag.knowledgeCheckStrategies,
  searchMode: config.rag.searchMode,
});
const embeddingAdapter = new VoyageEmbeddingAdapter();
const llmAdapter = new AnthropicLLMAdapter();
const fileParser = new MultiFileParser();
const appSettingsRepo = new PgAppSettingsRepository();
export const appSettingsService = new AppSettingsService(appSettingsRepo);
const storageBackends = createStorageBackends();
export const fileStorage = new DynamicFileStorage(
  () => appSettingsService.getSettings().then((s) => s.storage.provider),
  storageBackends,
);
export const createDocument = new CreateDocument(documentRepo, fileStorage);
export const ingestDocument = new IngestDocument(
  documentRepo,
  chunkRepo,
  embeddingAdapter,
  fileStorage,
  fileParser,
  () => appSettingsService.getChunkingConfig(),
  new Logger("IngestDocument"),
);
const reranker = config.rerank.enabled ? new VoyageRerankAdapter() : null;
export const searchKnowledge = new SearchKnowledge(
  chunkRepo,
  embeddingAdapter,
  new Logger("SearchKnowledge"),
  reranker,
  config.rerank.candidateMultiplier,
  config.rag.searchMode,
);
const knowledgeChecker = new CheckContextualKnowledge(
  llmAdapter,
  new Logger("CheckContextualKnowledge"),
);
export const askQuestion = new AskQuestion(
  searchKnowledge,
  llmAdapter,
  conversationRepo,
  documentRepo,
  new Logger("AskQuestion"),
  knowledgeChecker,
);
export const generateQuiz = new GenerateQuiz(
  chunkRepo,
  llmAdapter,
  new Logger("GenerateQuiz"),
);
export const summaryRepo = new PgDocumentSummaryRepository();
export const summarizeDocument = new SummarizeDocument(
  documentRepo,
  chunkRepo,
  summaryRepo,
  llmAdapter,
  new Logger("SummarizeDocument"),
);
export const checkStorageConsistency = new CheckStorageConsistency(
  documentRepo,
  fileStorage,
);
export const resetAll = new ResetAll(
  fileStorage,
  (patch) => appSettingsService.updateSettings(patch),
  chunkRepo,
  summaryRepo,
  conversationRepo,
  documentRepo,
  new Logger("ResetAll"),
);
