import type { ICreateDocument } from "./ICreateDocument";
import type { IIngestDocument } from "./IIngestDocument";
import type { ISummarizeDocument } from "./ISummarizeDocument";

export type { ICreateDocument, IIngestDocument, ISummarizeDocument };

export interface ArgosKnowledgeBase {
  createDocument: ICreateDocument;
  ingestDocument: IIngestDocument;
  summarizeDocument: ISummarizeDocument;
}
