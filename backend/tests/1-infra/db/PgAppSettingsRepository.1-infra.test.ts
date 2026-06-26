import { beforeAll, describe } from "vitest";
import { PgAppSettingsRepository } from "../../../src/infra/persistence/db/PgAppSettingsRepository";
import pool from "../../../src/infra/persistence/db/pool";
import { testIAppSettingsRepository } from "./testIAppSettingsRepositoryPort";

describe("PgAppSettingsRepository", () => {
  beforeAll(async () => {
    await pool.query("SELECT 1");
  });

  testIAppSettingsRepository(() => ({
    adapter: new PgAppSettingsRepository(),
    cleanup: async () => {
      await pool.query("DELETE FROM app_settings");
    },
  }));
});
