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
          title="Implementation — RetrieveKnowledge"
          subtitle="How the two stages are orchestrated"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          The{" "}
          <code className="bg-slate-100 px-1 rounded text-amber-700">
            RetrieveKnowledge
          </code>{" "}
          use case accepts an optional{" "}
          <code className="bg-slate-100 px-1 rounded text-amber-700">
            IRerankPort
          </code>
          . When <code className="bg-slate-100 px-1 rounded">null</code> (or
          disabled), it returns the single-stage search results directly. Stage
          1 honours the active search mode — vector or hybrid.
        </p>
        <CodeBlock
          code={`// application/RetrieveKnowledge.ts (simplified)

async execute(query, limit, minScore, rerankOptions, searchMode) {
  const vector = await embedder.embed(query, "query");
  const mode = searchMode ?? this.searchMode;
  const useRerank = this.reranker !== null && rerankOptions?.enabled !== false;

  // Stage 1 — broad retrieval (wider pool + permissive threshold when re-ranking)
  const candidateLimit = useRerank ? limit * candidateMultiplier : limit; // 8 × 3 = 24
  const candidateMinScore = useRerank ? minScore * 0.5 : minScore;
  const candidates = mode === "hybrid"
    ? await chunkRepo.searchHybrid(query, vector, candidateLimit, candidateMinScore)
    : await chunkRepo.searchByVector(vector, candidateLimit, candidateMinScore);

  if (!useRerank || candidates.length === 0) return candidates;

  // Stage 2 — cross-encoder re-ranking (falls back to retrieval order on failure)
  const rankedIndices = await this.reranker.rerank(
    query,
    candidates.map(c => c.chunk.content),
  );
  return rankedIndices.slice(0, limit).map(i => candidates[i]);
}`}
        />
        <div className="mt-4">
          <Callout type="info">
            <code>IRerankPort</code> is a domain interface with a single method:
            <code className="ml-1">
              rerank(query, documents, model?): Promise&lt;number[]&gt;
            </code>
            . The returned array contains original indices sorted from most to
            least relevant. Swapping the reranker (e.g. Cohere instead of
            Voyage) requires only a new adapter — no changes to{" "}
            <code>RetrieveKnowledge</code>.
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
            Increasing <code>RERANK_CANDIDATE_MULTIPLIER</code> beyond 5 sends a
            large document list to the Voyage API and adds noticeable latency.
            The default of 3 is a good balance between recall and response time.
          </Callout>
        </div>
      </Card>
    </>
  );
}
