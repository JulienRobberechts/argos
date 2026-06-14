import config from "../config";
import { PgAppSettingsRepository } from "../infrastructure/db/PgAppSettingsRepository";

export interface AppSettings {
  storage: { provider: string; bucketName: string; endpoint: string };
  embedding: { provider: string; model: string; apiKeySet: boolean };
  llm: { provider: string; model: string; apiKeySet: boolean };
}

export interface AppSettingsPatch {
  storage?: Partial<{ provider: string; bucketName: string; endpoint: string }>;
  embedding?: Partial<{ provider: string; model: string; apiKey: string }>;
  llm?: Partial<{ provider: string; model: string; apiKey: string }>;
}

export class AppSettingsService {
  constructor(private readonly repo: PgAppSettingsRepository) {}

  async getSettings(): Promise<AppSettings> {
    const stored = await this.repo.getAll();
    const r2 = config.storage.r2;
    const defaultEndpoint = r2.accountId
      ? `https://${r2.accountId}.r2.cloudflarestorage.com`
      : "";

    return {
      storage: {
        provider: stored["storage.provider"] ?? config.storage.backend,
        bucketName: stored["storage.bucketName"] ?? r2.bucketName,
        endpoint: stored["storage.endpoint"] ?? defaultEndpoint,
      },
      embedding: {
        provider: stored["embedding.provider"] ?? "voyage",
        model: stored["embedding.model"] ?? config.embeddings.voyage.model,
        apiKeySet: !!(
          stored["embedding.apiKey"] ?? config.embeddings.voyage.apiKey
        ),
      },
      llm: {
        provider: stored["llm.provider"] ?? "anthropic",
        model: stored["llm.model"] ?? config.llm.anthropic.model,
        apiKeySet: !!(stored["llm.apiKey"] ?? config.llm.anthropic.apiKey),
      },
    };
  }

  async updateSettings(patch: AppSettingsPatch): Promise<AppSettings> {
    const entries: Record<string, string> = {};

    if (patch.storage?.provider)
      entries["storage.provider"] = patch.storage.provider;
    if (patch.storage?.bucketName)
      entries["storage.bucketName"] = patch.storage.bucketName;
    if (patch.storage?.endpoint)
      entries["storage.endpoint"] = patch.storage.endpoint;
    if (patch.embedding?.provider)
      entries["embedding.provider"] = patch.embedding.provider;
    if (patch.embedding?.model)
      entries["embedding.model"] = patch.embedding.model;
    if (patch.embedding?.apiKey)
      entries["embedding.apiKey"] = patch.embedding.apiKey;
    if (patch.llm?.provider) entries["llm.provider"] = patch.llm.provider;
    if (patch.llm?.model) entries["llm.model"] = patch.llm.model;
    if (patch.llm?.apiKey) entries["llm.apiKey"] = patch.llm.apiKey;

    if (Object.keys(entries).length > 0) {
      await this.repo.setMany(entries);
    }

    return this.getSettings();
  }
}
