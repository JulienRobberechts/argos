import { describe } from "vitest";
import { testIRerankPort } from "../../1-infra/ai/testIRerankPort";
import { InMemoryRerankAdapter } from "../../fakes/InMemoryRerankAdapter";

describe("InMemoryRerankAdapter", () => {
  testIRerankPort(() => ({
    adapter: new InMemoryRerankAdapter([0, 1, 2]),
    cleanup: async () => {},
  }));
});
