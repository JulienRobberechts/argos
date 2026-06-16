import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { TextParser } from "./TextParser";

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "text-parser-test-"));
});

describe("TextParser", () => {
  it("should read file content as text", async () => {
    const filePath = join(tmpDir, "test.txt");
    await writeFile(filePath, "Hello world");
    const result = await new TextParser().parse(filePath);
    expect(result.text).toBe("Hello world");
  });

  it("should return correct metadata", async () => {
    const filePath = join(tmpDir, "meta.txt");
    await writeFile(filePath, "content");
    const result = await new TextParser().parse(filePath);
    expect(result.metadata.fileName).toBe("meta.txt");
    expect(result.metadata.mimeType).toBe("text/plain");
    expect(typeof result.metadata.fileSize).toBe("number");
    expect(result.metadata.fileSize).toBeGreaterThan(0);
  });

  it("should preserve multi-line content", async () => {
    const filePath = join(tmpDir, "multiline.txt");
    await writeFile(filePath, "line1\nline2\nline3");
    const result = await new TextParser().parse(filePath);
    expect(result.text).toBe("line1\nline2\nline3");
  });
});
