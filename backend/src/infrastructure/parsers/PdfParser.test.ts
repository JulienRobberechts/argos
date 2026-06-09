import { describe, it, expect, beforeAll } from "vitest";
import { writeFile, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { PdfParser } from "./PdfParser";

const ORIENT_EXPRESS_DIR = join(
  __dirname,
  "../../../tests/DOCUMENTS/Orient-Express",
);

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "pdf-parser-test-"));
});

describe("PdfParser", () => {
  it("should throw a descriptive error prefixed with filename on invalid PDF", async () => {
    const filePath = join(tmpDir, "invalid.pdf");
    await writeFile(filePath, Buffer.from("not a pdf"));
    await expect(new PdfParser().parse(filePath)).rejects.toThrow(
      'Failed to parse PDF "invalid.pdf"',
    );
  });

  it("should include original error message in the thrown error", async () => {
    const filePath = join(tmpDir, "empty.pdf");
    await writeFile(filePath, Buffer.alloc(0));
    const err = await new PdfParser().parse(filePath).catch((e) => e);
    expect(err.message).toMatch(/^Failed to parse PDF "empty\.pdf": /);
  });
});

// Ces tests échouent intentionnellement pour mettre en évidence les défauts
// de pdf-parse lors de l'extraction du texte de PDFs réels.
describe("PdfParser - qualité du texte extrait (PDFs Orient-Express)", () => {
  const PDF = join(
    ORIENT_EXPRESS_DIR,
    "Luxe - VSOE par Discovery Trains-p3.pdf",
  );
  const DEBUG_FILE = PDF.replace(/\.pdf$/, ".debug.txt");

  let parsedText: string;

  beforeAll(async () => {
    const result = await new PdfParser().parse(PDF);
    parsedText = result.text;
    await writeFile(DEBUG_FILE, parsedText, "utf-8");
  });

  it("ne devrait pas fusionner des mots en supprimant les espaces", () => {
    const text = parsedText;
    // pdf-parse supprime l'espace typographique entre colonnes :
    // "Venice Simplon-Orient-Express" devient "VeniceSimplon-Orient-Express"
    expect(text).not.toContain("VeniceSimplon");
    expect(text).toContain("Venice Simplon");
  });

  it("ne devrait pas décomposer les ligatures (fi, fl) en sauts de ligne", () => {
    const text = parsedText;
    // pdf-parse fragmente la ligature «fi» : "défilent" → "dé\nfi\nlent"
    expect(text).toContain("défilent");
  });

  it("ne devrait pas conserver les césures de fin de ligne dans les mots", () => {
    const text = parsedText;
    // pdf-parse conserve le tiret de césure : "rencontres" → "ren-\ncontres"
    expect(text).toContain("rencontres");
    expect(text).not.toMatch(/ren\s*-\s*\ncontres/);
  });
});
