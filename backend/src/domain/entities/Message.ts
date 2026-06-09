export interface SourceCitation {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  sourceType: "pdf" | "markdown" | "text";
  excerpt: string;
  score: number;
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sources: SourceCitation[];
  createdAt: Date;
}
