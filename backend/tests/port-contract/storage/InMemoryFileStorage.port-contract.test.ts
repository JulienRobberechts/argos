import { describe, expect } from "vitest";
import { testFileStoragePort } from "../../1-infra/storage/testIFileStoragePort";
import { InMemoryFileStorage } from "../../fakes/InMemoryFileStorage";

describe("InMemoryFileStorage", () => {
  testFileStoragePort(async () => {
    const storage = new InMemoryFileStorage();
    return {
      storage,
      cleanup: async () => storage.deleteAll(),
      verifyOnMedium: async (key, expected) => {
        const stored = await storage.download(key);
        expect(stored).toEqual(expected);
      },
    };
  });
});
