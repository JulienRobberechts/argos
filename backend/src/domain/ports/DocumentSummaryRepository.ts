import { DocumentSummary } from "../entities/DocumentSummary";

export interface DocumentSummaryRepository {
  findByDocumentId(documentId: string): Promise<DocumentSummary | null>;
  upsert(documentId: string, content: string): Promise<void>;
}
