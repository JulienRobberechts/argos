export interface ISummarizeDocument {
  execute(documentId: string): Promise<string>;
}
