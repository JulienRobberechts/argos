import { describe } from "vitest";
import { VoyageEmbeddingAdapter } from "../../src/infra/ai/embeddings/VoyageEmbeddingAdapter";
import { testITextEncoderPort } from "./ai/testITextEncoderPort";

describe("VoyageEmbeddingAdapter", () => {
  testITextEncoderPort(() => {
    const apiKey = process.env.VOYAGE_API_KEY;
    if (!apiKey || apiKey === "test-key") {
      throw new Error("Missing env var: VOYAGE_API_KEY");
    }
    return {
      adapter: new VoyageEmbeddingAdapter(apiKey),
      cleanup: async () => {},
    };
  });
});
