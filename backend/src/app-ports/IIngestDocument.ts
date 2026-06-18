export interface IIngestDocument {
  execute(documentId: string): Promise<void>;
}
