import { Code2, Search } from "lucide-react";
import Callout from "../../../components/ui/Callout";
import Card from "../../../components/ui/Card";
import CodeBlock from "../../../components/ui/CodeBlock";
import ParamRow from "../../../components/ui/ParamRow";
import SectionTitle from "../../../components/ui/SectionTitle";

export default function ImplementationTab() {
  return (
    <>
      <Card className="mb-6">
        <SectionTitle
          icon={<Search size={20} />}
          title="Implementation — SearchKnowledge"
          subtitle="How the two stages are orchestrated"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          The <code className="bg-slate-100 px-1 rounded text-amber-700">SearchKnowledge</code> use
          case accepts an optional{" "}
          <code className="bg-slate-100 px-1 rounded text-amber-700">RerankPort</code>. When{" "}
          <code className="bg-slate-100 px-1 rounded">null</code>, it falls back to single-stage
          vector search.
        </p>
        <CodeBlock
          code={`// application/SearchKnowledge.ts (simplified)

async execute(query, limit, minScore) {
  const vector = await embedder.embed(query, "query");

  if (this.reranker) {
    // Stage 1 — broad retrieval
    const candidates = await chunkRepo.search(
      vector,
      limit * candidateMultiplier,   // e.g. 8 × 3 = 24
      minScore * 0.5,                // permissive threshold
    );

    // Stage 2 — cross-encoder re-ranking
    const rankedIndices = await this.reranker.rerank(
      query,
      candidates.map(c => c.chunk.content),
    );

    return rankedIndices.slice(0, limit).map(i => candidates[i]);
  }

  // No reranker — standard vector search
  return chunkRepo.search(vector, limit, minScore);
}`}
        />
        <div className="mt-4">
          <Callout type="info">
            <code>RerankPort</code> is a domain interface with a single method:
            <code className="ml-1">rerank(query, documents): Promise&lt;number[]&gt;</code>. The
            returned array contains original indices sorted from most to least relevant. Swapping
            the reranker (e.g. Cohere instead of Voyage) requires only a new adapter — no changes to{" "}
            <code>SearchKnowledge</code>.
          </Callout>
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon={<Code2 size={20} />}
          title="Configuration"
          subtitle="Enabling, disabling, and tuning re-ranking"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Env var
                </th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Default
                </th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Effect
                </th>
              </tr>
            </thead>
            <tbody>
              <ParamRow
                name="RERANK_ENABLED"
                value="true*"
                description="Explicitly enable or disable re-ranking. *If unset, re-ranking is active whenever VOYAGE_API_KEY is present. Set to 'false' to force-disable."
              />
              <ParamRow
                name="RERANK_MODEL"
                value="rerank-2.5"
                description="Voyage AI reranker model to use. rerank-2.5 is the current production model. rerank-lite-1 is faster and cheaper but less accurate."
              />
              <ParamRow
                name="RERANK_CANDIDATE_MULTIPLIER"
                value="3"
                description="Stage 1 fetches limit × this many candidates before re-ranking. Higher values improve recall at the cost of a larger re-ranking payload (and slightly more latency)."
              />
              <ParamRow
                name="RETRIEVAL_LIMIT"
                value="8"
                description="Final number of chunks returned after re-ranking. Stage 1 fetches limit × RERANK_CANDIDATE_MULTIPLIER candidates, stage 2 keeps only this many."
              />
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Callout type="warning">
            Increasing <code>RERANK_CANDIDATE_MULTIPLIER</code> beyond 5 sends a large document list
            to the Voyage API and adds noticeable latency. The default of 3 is a good balance
            between recall and response time.
          </Callout>
        </div>
      </Card>
    </>
  );
}
