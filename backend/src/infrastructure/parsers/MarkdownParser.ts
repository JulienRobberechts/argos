import fs from "fs";
import path from "path";
import { FileParserPort, ParseResult } from "../../domain/ports/FileParserPort";

export class MarkdownParser implements FileParserPort {
  async parse(filePath: string): Promise<ParseResult> {
    const { marked } = await import("marked");
    const content = await fs.promises.readFile(filePath, "utf-8");
    const stats = await fs.promises.stat(filePath);
    const html = marked.parse(content) as string;
    const text = html
      .replace(/<[^>]*>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    return {
      text,
      metadata: {
        fileName: path.basename(filePath),
        fileSize: stats.size,
        mimeType: "text/markdown",
      },
    };
  }
}
