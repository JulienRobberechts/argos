import { beforeAll, describe, expect, it } from "vitest";
import { VoyageRerankAdapter } from "../../../src/infra/ai/reranking/VoyageRerankAdapter";
import type { IRerankPort } from "../../../src/infra-ports/ai";
import { testIRerankPort } from "./testIRerankPort";

function makeAdapter(): IRerankPort {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey || apiKey === "test-key") {
    throw new Error("Missing env var: VOYAGE_API_KEY");
  }
  return new VoyageRerankAdapter(apiKey);
}

describe("VoyageRerankAdapter", () => {
  testIRerankPort(() => ({
    adapter: makeAdapter(),
    cleanup: async () => {},
  }));

  describe("semantic ranking", () => {
    let adapter: IRerankPort;

    beforeAll(() => {
      adapter = makeAdapter();
    });

    it("ranks semantically relevant document first", async () => {
      const result = await adapter.rerank("capital city of France", [
        "Dogs are mammals and have fur.",
        "Paris is the capital and largest city of France.",
      ]);
      expect(result[0]).toBe(1);
    }, 30_000);
  });
});
