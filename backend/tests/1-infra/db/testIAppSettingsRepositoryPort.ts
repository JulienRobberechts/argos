import { beforeAll, beforeEach, expect, it } from "vitest";
import type { IAppSettingsRepository } from "../../../src/infra-ports/persistence";

type Setup = {
  adapter: IAppSettingsRepository;
  cleanup: () => Promise<void>;
};

export function testIAppSettingsRepository(setup: () => Setup): void {
  let adapter: IAppSettingsRepository;
  let cleanup: () => Promise<void>;

  beforeAll(() => {
    ({ adapter, cleanup } = setup());
  });

  beforeEach(async () => {
    await cleanup();
  });

  it("getAll returns empty record when no settings exist", async () => {
    const result = await adapter.getAll();
    expect(result).toEqual({});
  });

  it("setMany stores entries and getAll retrieves them", async () => {
    await adapter.setMany({ key1: "value1", key2: "value2" });
    const result = await adapter.getAll();
    expect(result).toMatchObject({ key1: "value1", key2: "value2" });
  });

  it("setMany upserts existing keys", async () => {
    await adapter.setMany({ key1: "original" });
    await adapter.setMany({ key1: "updated" });
    const result = await adapter.getAll();
    expect(result.key1).toBe("updated");
  });

  it("setMany with empty object leaves settings unchanged", async () => {
    await adapter.setMany({ existing: "value" });
    await adapter.setMany({});
    const result = await adapter.getAll();
    expect(result.existing).toBe("value");
  });

  it("setMany merges new keys with existing ones", async () => {
    await adapter.setMany({ a: "1" });
    await adapter.setMany({ b: "2" });
    const result = await adapter.getAll();
    expect(result).toMatchObject({ a: "1", b: "2" });
  });
}
