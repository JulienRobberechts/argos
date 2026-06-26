import { describe } from "vitest";
import { AnthropicLLMAdapter } from "../../src/infra/ai/llm/AnthropicLLMAdapter";
import { testILLMPort } from "./ai/testILLMPort";

describe("AnthropicLLMAdapter", () => {
  testILLMPort(() => {
    const apiKey = process.env.ANTHROPIC_APP_API_KEY;
    if (!apiKey || apiKey === "test-key") {
      throw new Error("Missing env var: ANTHROPIC_APP_API_KEY");
    }
    return {
      adapter: new AnthropicLLMAdapter(apiKey),
      cleanup: async () => {},
    };
  });
});
