export interface ParseResult {
  text: string;
  metadata: Record<string, unknown>;
}

export interface IFileParserPort {
  parse(filePath: string): Promise<ParseResult>;
}
