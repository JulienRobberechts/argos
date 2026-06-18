import path from "node:path";
import type { IFileParserPort, ParseResult } from "../../infra-ports/storage/IFileParserPort";
import { MarkdownParser } from "./MarkdownParser";
import { PdfParser } from "./PdfParser";
import { TextParser } from "./TextParser";

const markdownParser = new MarkdownParser();
const pdfParser = new PdfParser();
const textParser = new TextParser();

export class MultiFileParser implements IFileParserPort {
  async parse(filePath: string): Promise<ParseResult> {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".md":
      case ".markdown":
        return markdownParser.parse(filePath);
      case ".pdf":
        return pdfParser.parse(filePath);
      default:
        return textParser.parse(filePath);
    }
  }
}
