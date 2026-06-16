import { DocumentSummary } from "../entities/DocumentSummary";

export interface IDocumentSummaryRepository {
  findByDocumentId(documentId: string): Promise<DocumentSummary | null>;
  upsert(documentId: string, content: string): Promise<void>;
}
