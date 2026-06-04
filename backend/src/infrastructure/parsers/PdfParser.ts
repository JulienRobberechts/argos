import fs from "fs";
import path from "path";
import { FileParserPort, ParseResult } from "../../domain/ports/FileParserPort";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse/lib/pdf-parse");

interface PdfData {
  text: string;
  numpages: number;
}

export class PdfParser implements FileParserPort {
  async parse(filePath: string): Promise<ParseResult> {
    const buffer = await fs.promises.readFile(filePath);
    const stats = await fs.promises.stat(filePath);
    try {
      const data = (await pdfParse(buffer)) as PdfData;
      return {
        text: data.text,
        metadata: {
          fileName: path.basename(filePath),
          fileSize: stats.size,
          mimeType: "application/pdf",
          numPages: data.numpages,
        },
      };
    } catch (err) {
      throw new Error(
        `Failed to parse PDF "${path.basename(filePath)}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
