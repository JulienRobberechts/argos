import { Pool } from "pg";
import { FileStoragePort } from "../domain/ports/FileStoragePort";
import { AppSettingsService, AppSettingsPatch } from "./AppSettingsService";

export class ResetAll {
  constructor(
    private readonly fileStorage: FileStoragePort,
    private readonly settingsService: AppSettingsService,
    private readonly pool: Pool,
  ) {}

  async execute(newSettings?: AppSettingsPatch): Promise<void> {
    if (newSettings) {
      await this.settingsService.updateSettings(newSettings);
    }

    await this.fileStorage.deleteAll();

    await this.pool.query(
      "TRUNCATE TABLE messages, document_summaries, chunks, conversations, documents CASCADE",
    );
  }
}
