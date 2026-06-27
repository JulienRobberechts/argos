import type { IAppSettingsRepository } from "../../src/infra-ports/persistence/IAppSettingsRepository";

export class InMemoryAppSettingsRepository implements IAppSettingsRepository {
  private settings: Record<string, string> = {};

  async getAll(): Promise<Record<string, string>> {
    return { ...this.settings };
  }

  async setMany(entries: Record<string, string>): Promise<void> {
    Object.assign(this.settings, entries);
  }

  clear(): void {
    this.settings = {};
  }
}
