import type { Document } from "../../domain/entities/Document";

export interface CreateDocumentInput {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  title?: string;
}

export interface ICreateDocument {
  execute(input: CreateDocumentInput): Promise<Document>;
}
