import fs from "fs";
import path from "path";
import { FileParserPort, ParseResult } from "../../domain/ports/FileParserPort";

export class TextParser implements FileParserPort {
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
