import { Document, DocumentStatus } from "../../src/domain/entities/Document";
import { DocumentRepository } from "../../src/domain/ports/DocumentRepository";

export class InMemoryDocumentRepository implements DocumentRepository {
  private documents: Map<string, Document> = new Map();

  async save(document: Document): Promise<void> {
    this.documents.set(document.id, { ...document });
  }

  async findById(id: string): Promise<Document | null> {
    return this.documents.get(id) ?? null;
  }

  async findAll(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async delete(id: string): Promise<void> {
    this.documents.delete(id);
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) {
      this.documents.set(id, { ...doc, status });
    }
  }

  clear(): void {
    this.documents.clear();
  }
}
