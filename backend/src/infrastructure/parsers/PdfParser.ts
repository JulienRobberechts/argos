import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { FileParserPort, ParseResult } from "../../domain/ports/FileParserPort";

export class PdfParser implements FileParserPort {
  async parse(filePath: string): Promise<ParseResult> {
    const stats = await fs.promises.stat(filePath);
    const url = `file://${filePath}`;
    const parser = new PDFParse({ url });
    try {
      const [textResult, infoResult] = await Promise.all([
        parser.getText(),
        parser.getInfo(),
      ]);
      return {
        text: textResult.text,
        metadata: {
          fileName: path.basename(filePath),
          fileSize: stats.size,
          mimeType: "application/pdf",
          numPages: infoResult.total,
        },
      };
    } catch (err) {
      throw new Error(
        `Failed to parse PDF "${path.basename(filePath)}": ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      await parser.destroy();
    }
  }
}
