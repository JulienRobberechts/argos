export interface ParseResult {
  text: string;
  metadata: Record<string, unknown>;
}

export interface FileParserPort {
  parse(filePath: string): Promise<ParseResult>;
}
