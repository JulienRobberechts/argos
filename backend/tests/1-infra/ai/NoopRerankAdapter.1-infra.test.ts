import { describe } from "vitest";
import { NoopRerankAdapter } from "../../../src/infra/ai/reranking/NoopRerankAdapter";
import { testIRerankPort } from "./testIRerankPort";

describe("NoopRerankAdapter", () => {
  testIRerankPort(() => ({
    adapter: new NoopRerankAdapter(),
    cleanup: async () => {},
  }));
});
