import fs from "fs";
import path from "path";
import { FileStoragePort } from "../../domain/ports/FileStoragePort";

export class LocalFileStorage implements FileStoragePort {
  constructor(private readonly uploadDir: string) {}

  async upload(
    key: string,
    buffer: Buffer,
    _mimetype: string,
  ): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    return fs.promises.readFile(path.join(this.uploadDir, key));
  }

  async delete(key: string): Promise<void> {
    await fs.promises.unlink(path.join(this.uploadDir, key));
  }

  async list(): Promise<string[]> {
    return this.listDir(this.uploadDir, this.uploadDir);
  }

  private async listDir(dir: string, base: string): Promise<string[]> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return [];
    }
    const results: string[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await this.listDir(full, base)));
      } else {
        results.push(path.relative(base, full));
      }
    }
    return results;
  }
}
