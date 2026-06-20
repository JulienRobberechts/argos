export * from "./ICreateDocument";
export * from "./IDeleteDocument";
export * from "./IIngestDocument";
export * from "./ISummarizeDocument";
export * from "./queries";

import type { ICreateDocument } from "./ICreateDocument";
import type { IDeleteDocument } from "./IDeleteDocument";
import type { IIngestDocument } from "./IIngestDocument";
import type { ISummarizeDocument } from "./ISummarizeDocument";
import type { IDocumentQueries } from "./queries";

export interface ArgosKnowledgeBase {
  createDocument: ICreateDocument;
  ingestDocument: IIngestDocument;
  summarizeDocument: ISummarizeDocument;
  deleteDocument: IDeleteDocument;
  documentQueries: IDocumentQueries;
}
