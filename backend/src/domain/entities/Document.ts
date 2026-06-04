export type DocumentStatus = "pending" | "processing" | "ready" | "error";
export type SourceType = "pdf" | "markdown" | "text";

export interface Document {
  id: string;
  title: string;
  sourceType: SourceType;
  status: DocumentStatus;
  createdAt: Date;
  filePath: string | null;
}
