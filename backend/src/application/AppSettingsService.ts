import config from "../config";
import { PgAppSettingsRepository } from "../infrastructure/db/PgAppSettingsRepository";

export interface ProviderOption {
  provider: string;
  model: string;
  label: string;
  available: boolean;
}

export interface StorageOption {
  provider: string;
  label: string;
  available: boolean;
}

export interface AppSettings {
  embedding: { provider: string; model: string; options: ProviderOption[] };
  storage: { provider: string; options: StorageOption[] };
}

export interface AppSettingsPatch {
  embedding?: { provider: string };
  storage?: { provider: string };
}

const EMBEDDING_PRESETS: Omit<ProviderOption, "available">[] = [
  {
    provider: "voyage",
    model: "voyage-4-lite",
    label: "Voyage AI — voyage-4-lite",
  },
  {
    provider: "openai",
    model: "text-embedding-3-small",
    label: "OpenAI — text-embedding-3-small",
  },
  {
    provider: "mistral",
    model: "mistral-embed",
    label: "Mistral — mistral-embed",
  },
];

function r2Available(): boolean {
  const { accountId, accessKeyId, secretAccessKey, bucketName } =
    config.storage.r2;
  return !!(accountId && accessKeyId && secretAccessKey && bucketName);
}

export class AppSettingsService {
  constructor(private readonly repo: PgAppSettingsRepository) {}

  async getSettings(): Promise<AppSettings> {
    const stored = await this.repo.getAll();

    const currentEmbeddingProvider = stored["embedding.provider"] ?? "voyage";
    const preset =
      EMBEDDING_PRESETS.find((p) => p.provider === currentEmbeddingProvider) ??
      EMBEDDING_PRESETS[0];

    const embeddingOptions: ProviderOption[] = EMBEDDING_PRESETS.map((p) => ({
      ...p,
      available: !!(p.provider === "voyage"
        ? config.embeddings.voyage.apiKey
        : p.provider === "openai"
          ? process.env.OPENAI_API_KEY
          : p.provider === "mistral"
            ? process.env.MISTRAL_API_KEY
            : false),
    }));

    const currentStorageProvider =
      stored["storage.provider"] ?? config.storage.backend;

    const storageOptions: StorageOption[] = [
      { provider: "r2", label: "Cloudflare R2", available: r2Available() },
      { provider: "local", label: "Local disk", available: true },
    ];

    return {
      embedding: {
        provider: preset.provider,
        model: preset.model,
        options: embeddingOptions,
      },
      storage: {
        provider: currentStorageProvider,
        options: storageOptions,
      },
    };
  }

  async updateSettings(patch: AppSettingsPatch): Promise<AppSettings> {
    const entries: Record<string, string> = {};
    if (patch.embedding?.provider)
      entries["embedding.provider"] = patch.embedding.provider;
    if (patch.storage?.provider)
      entries["storage.provider"] = patch.storage.provider;
    if (Object.keys(entries).length > 0) await this.repo.setMany(entries);
    return this.getSettings();
  }
}
