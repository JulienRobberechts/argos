export interface FileStoragePort {
  upload(key: string, buffer: Buffer, mimetype: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}
