import { ChunkRepository } from "../domain/ports/ChunkRepository";
import { DocumentRepository } from "../domain/ports/DocumentRepository";
import { DocumentSummaryRepository } from "../domain/ports/DocumentSummaryRepository";
import { LLMPort } from "../domain/ports/LLMPort";
import { Logger } from "../infrastructure/logger/Logger";

const MAX_CONTENT_CHARS = 12000;

export class SummarizeDocument {
  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly chunkRepo: ChunkRepository,
    private readonly summaryRepo: DocumentSummaryRepository,
    private readonly llmAdapter: LLMPort,
  ) {}

  private readonly logger = new Logger("SummarizeDocument");

  async execute(documentId: string): Promise<string> {
    const doc = await this.documentRepo.findById(documentId);
    if (!doc) throw new Error("Document not found");

    const chunks = await this.chunkRepo.findByDocumentId(documentId);
    if (chunks.length === 0) throw new Error("Document has no content");

    const content = chunks
      .map((c) => c.content)
      .join("\n\n")
      .slice(0, MAX_CONTENT_CHARS);

    const maxChars = Math.min(Math.floor(content.length / 2), 500);

    this.logger.info(
      `Summarizing document ${documentId} with content length ${content.length} chars, max summary length ${maxChars} chars`,
    );
    this.logger.debug(
      `Summarizing document ${documentId} with content : ${content}`,
    );

    const prompt = [
      `Write a concise summary of the document titled "${doc.title}".`,
      "Cover the main topics, key concepts, and important information.",
      `The summary must be strictly less than ${maxChars} characters (hard limit).`,
      "Write plain prose, no bullet points, no title or heading.",
      "Write the summary in the same language as the document content.",
      "",
      "DOCUMENT CONTENT:",
      content,
    ].join("\n");

    const summary = await this.llmAdapter.stream(prompt, () => {});
    await this.summaryRepo.upsert(documentId, summary.trim());
    return summary.trim();
  }
}
