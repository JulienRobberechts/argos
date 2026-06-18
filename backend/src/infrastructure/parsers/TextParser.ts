import fs from "node:fs";
import path from "node:path";
import type { IFileParserPort, ParseResult } from "../../infra-ports/IFileParserPort";

export class TextParser implements IFileParserPort {
  async parse(filePath: string): Promise<ParseResult> {
    const content = await fs.promises.readFile(filePath, "utf-8");
    const stats = await fs.promises.stat(filePath);
    return {
      text: content,
      metadata: {
        fileName: path.basename(filePath),
        fileSize: stats.size,
        mimeType: "text/plain",
      },
    };
  }
}
