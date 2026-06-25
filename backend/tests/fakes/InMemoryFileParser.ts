import type {
  IDocumentParserPort,
  ParseInput,
  ParseResult,
} from "../../src/infra-ports/storage/IDocumentParserPort";

export class InMemoryFileParser implements IDocumentParserPort {
  private text: string;

  constructor(text = "word1 word2 word3 word4 word5") {
    this.text = text;
  }

  setText(text: string): void {
    this.text = text;
  }

  async parse(input: ParseInput): Promise<ParseResult> {
    return { text: this.text, metadata: { fileName: input.fileName } };
  }
}
