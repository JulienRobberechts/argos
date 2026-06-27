import { randomUUID } from "node:crypto";
import type { DocumentSummary } from "../../src/domain/entities/DocumentSummary";
import type { IDocumentSummaryRepository } from "../../src/infra-ports/persistence/IDocumentSummaryRepository";

export class InMemoryDocumentSummaryRepository implements IDocumentSummaryRepository {
  private summaries: Map<string, DocumentSummary> = new Map();

  async findByDocumentId(documentId: string): Promise<DocumentSummary | null> {
    return this.summaries.get(documentId) ?? null;
  }

  async upsert(documentId: string, content: string): Promise<void> {
    const existing = this.summaries.get(documentId);
    const now = new Date();
    this.summaries.set(documentId, {
      id: existing?.id ?? randomUUID(),
      documentId,
      content,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async deleteAll(): Promise<void> {
    this.summaries.clear();
  }

  clear(): void {
    this.summaries.clear();
  }
}
