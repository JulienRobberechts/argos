import type { IDeleteDocument } from "../../app-ports/knowledgeBase";
import type { IChunkRepository, IDocumentRepository } from "../../infra-ports/persistence";
import type { IFileStoragePort } from "../../infra-ports/storage";

export class DeleteDocument implements IDeleteDocument {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly chunkRepo: IChunkRepository,
    private readonly fileStorage: IFileStoragePort,
  ) {}

  async execute(id: string): Promise<void> {
    const doc = await this.documentRepo.findById(id);
    if (!doc) return;
    if (doc.filePath) {
      await this.fileStorage.delete(doc.filePath).catch(() => {});
    }
    await this.chunkRepo.deleteByDocumentId(id);
    await this.documentRepo.delete(id);
  }
}
