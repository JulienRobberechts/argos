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
  chunking?: {
    strategy?: "recursive" | "sentence";
    chunkSize?: number;
    chunkOverlap?: number;
  };
}

export interface ChunkingConfig {
  strategy: "recursive" | "sentence";
  chunkSize: number;
  chunkOverlap: number;
}

export interface IAppSettingsService {
  getSettings(): Promise<AppSettings>;
  getChunkingConfig(): Promise<ChunkingConfig>;
  updateSettings(patch: AppSettingsPatch): Promise<AppSettings>;
}
