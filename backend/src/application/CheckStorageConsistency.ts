import { DocumentRepository } from "../domain/ports/DocumentRepository";
import { FileStoragePort } from "../domain/ports/FileStoragePort";

export interface StorageConsistencyResult {
  orphanFiles: string[];
  missingFiles: string[];
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
      docs.filter((d) => d.filePath).map((d) => d.filePath!),
    );
    const storageSet = new Set(storageKeys);

    return {
      orphanFiles: storageKeys.filter((k) => !dbKeys.has(k)),
      missingFiles: [...dbKeys].filter((k) => !storageSet.has(k)),
    };
  }
}
