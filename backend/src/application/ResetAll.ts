import { Pool } from "pg";
import { IFileStoragePort } from "../domain/ports/IFileStoragePort";
import { AppSettingsService, AppSettingsPatch } from "./AppSettingsService";

const logger = console;

export class ResetAll {
  constructor(
    private readonly fileStorage: IFileStoragePort,
    private readonly settingsService: AppSettingsService,
    private readonly pool: Pool,
  ) {}

  async execute(newSettings?: AppSettingsPatch): Promise<void> {
    // Best-effort: delete files from current storage before switching provider.
    // If storage is unreachable, log and continue — DB reset must not be blocked.
    await this.fileStorage.deleteAll().catch((err) => {
      logger.warn("[ResetAll] storage.deleteAll() failed, continuing:", err);
    });

    await this.pool.query(
      "TRUNCATE TABLE messages, document_summaries, chunks, conversations, documents CASCADE",
    );

    if (newSettings) {
      await this.settingsService.updateSettings(newSettings);
    }
  }
}
