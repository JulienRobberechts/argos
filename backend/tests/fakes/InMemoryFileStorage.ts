import type { IFileStoragePort } from "../../src/infra-ports/storage/IFileStoragePort";

export class InMemoryFileStorage implements IFileStoragePort {
  private files = new Map<string, Buffer>();

  seed(key: string, content: Buffer): this {
    this.files.set(key, content);
    return this;
  }

  async upload(key: string, buffer: Buffer, _mimetype: string): Promise<string> {
    this.files.set(key, buffer);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const buf = this.files.get(key);
    if (!buf) throw new Error(`File not found: ${key}`);
    return buf;
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }

  async list(): Promise<string[]> {
    return Array.from(this.files.keys());
  }

  async deleteAll(): Promise<void> {
    this.files.clear();
  }
}
