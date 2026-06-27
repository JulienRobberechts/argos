import { describe } from "vitest";
import { testITextEncoderPort } from "../../1-infra/ai/testITextEncoderPort";
import { InMemoryEmbeddingAdapter } from "../../fakes/InMemoryEmbeddingAdapter";

describe("InMemoryEmbeddingAdapter", () => {
  testITextEncoderPort(() => ({
    adapter: new InMemoryEmbeddingAdapter(),
    cleanup: async () => {},
  }));
});
