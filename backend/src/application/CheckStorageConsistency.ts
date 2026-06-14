import path from "path";
import { DocumentRepository } from "../domain/ports/DocumentRepository";
import { FileStoragePort } from "../domain/ports/FileStoragePort";

export interface StorageConsistencyResult {
  orphanFiles: string[];
  missingFiles: string[];
  totalDocuments: number;
  totalStorageFiles: number;
}

// Extracts just the filename from a path that may be absolute or relative.
// Handles legacy DB records that stored full paths like /app/uploads/uuid.pdf
// while storage returns relative keys like uuid.pdf.
function toKey(filePath: string): string {
  return path.basename(filePath);
}

export class CheckStorageConsistency {
  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly fileStorage: FileStoragePort,
  ) {}

  async execute(): Promise<StorageConsistencyResult> {
    const [docs, storageKeys] = await Promise.all([
      this.documentRepo.findAll(),
      this.fileStorage.list(),
    ]);

    const dbKeys = new Set(
      docs.filter((d) => d.filePath).map((d) => toKey(d.filePath!)),
    );
    const storageSet = new Set(storageKeys.map(toKey));

    return {
      orphanFiles: storageKeys.filter((k) => !dbKeys.has(toKey(k))),
      missingFiles: [...dbKeys].filter((k) => !storageSet.has(k)),
      totalDocuments: docs.length,
      totalStorageFiles: storageKeys.length,
    };
  }
}
