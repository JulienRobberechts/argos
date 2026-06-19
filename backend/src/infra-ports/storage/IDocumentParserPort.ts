export interface ParseInput {
  buffer: Buffer;
  fileName: string;
}

export interface ParseResult {
  text: string;
  metadata: Record<string, unknown>;
}

/** Extracts raw text and metadata from uploaded document content. */
export interface IDocumentParserPort {
  /** Extracts text and metadata from a document buffer. */
  parse(input: ParseInput): Promise<ParseResult>;
}
