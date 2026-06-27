import { describe } from "vitest";
import { testILLMPort } from "../../1-infra/ai/testILLMPort";
import { InMemoryLLMAdapter } from "../../fakes/InMemoryLLMAdapter";

describe("InMemoryLLMAdapter", () => {
  testILLMPort(() => ({
    adapter: new InMemoryLLMAdapter(),
    cleanup: async () => {},
  }));
});
