import { describe } from "vitest";
import { testIAppSettingsRepository } from "../../1-infra/db/testIAppSettingsRepositoryPort";
import { InMemoryAppSettingsRepository } from "../../fakes/InMemoryAppSettingsRepository";

describe("InMemoryAppSettingsRepository", () => {
  const repo = new InMemoryAppSettingsRepository();

  testIAppSettingsRepository(() => ({
    adapter: repo,
    cleanup: async () => repo.clear(),
  }));
});
