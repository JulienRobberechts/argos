import { ArrowRight, Layers, Zap } from "lucide-react";
import Callout from "../../../components/ui/Callout";
import Card from "../../../components/ui/Card";
import CodeBlock from "../../../components/ui/CodeBlock";
import SectionTitle from "../../../components/ui/SectionTitle";

type FlowBoxColor = "amber" | "yellow" | "green" | "slate";

function FlowBox({
  label,
  sub,
  color = "amber",
}: {
  label: string;
  sub?: string;
  color?: FlowBoxColor;
}) {
  const colors: Record<FlowBoxColor, string> = {
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    green: "bg-green-50 border-green-200 text-green-900",
    slate: "bg-slate-50 border-slate-200 text-slate-600",
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-center ${colors[color]}`}>
      <p className="text-sm font-semibold">{label}</p>
      {sub && <p className="text-xs mt-0.5 opacity-70">{sub}</p>}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center text-slate-400 py-1">
      <ArrowRight size={16} />
    </div>
  );
}

export default function PipelineTab() {
  return (
    <>
      <Card className="mb-6">
        <SectionTitle
          icon={<Layers size={20} />}
          title="Two-stage retrieval pipeline"
          subtitle="How it works in this project"
        />

        <div className="flex flex-col gap-1 mb-6">
          <FlowBox
            label="User question"
            sub="'Quand a commencé l'Orient-Express ?'"
            color="yellow"
          />
          <Arrow />
          <FlowBox
            label="Stage 1 — Candidate retrieval (vector or hybrid)"
            sub={`embed(question, "query") → search → top ${String(3 * 8)} candidates (3× limit)`}
            color="amber"
          />
          <Arrow />
          <FlowBox
            label="Stage 2 — Cross-encoder re-ranking"
            sub="Voyage rerank-2.5: score each (question, chunk) pair together"
            color="amber"
          />
          <Arrow />
          <FlowBox label="Top-8 re-ranked chunks" sub="Sent to the LLM as context" color="green" />
        </div>

        <p className="text-sm font-medium text-slate-800 mb-2">Why 3× candidates?</p>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Because vector search may rank the right chunks at positions 9–15 (just outside the final
          limit), the first stage fetches{" "}
          <code className="bg-slate-100 px-1 rounded text-amber-700">
            limit × candidateMultiplier
          </code>{" "}
          candidates (default: 8 × 3 = 24). The re-ranker then sees a wider pool and can promote the
          best chunks to the top-8.
        </p>
        <p className="text-sm font-medium text-slate-800 mb-2">Score threshold during stage 1</p>
        <p className="text-sm text-slate-600 leading-relaxed">
          When re-ranking is enabled, the first stage uses a more permissive cosine threshold:{" "}
          <code className="bg-slate-100 px-1 rounded text-amber-700">minScore × 0.5</code>. This
          casts a wider net so that relevant chunks with lower cosine similarity (but high
          cross-encoder relevance) are not discarded before the re-ranker ever sees them.
        </p>
      </Card>

      <Card>
        <SectionTitle
          icon={<Zap size={20} />}
          title="Voyage rerank-2.5 API"
          subtitle="The cross-encoder used in this project"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          This project uses Voyage AI's{" "}
          <code className="bg-slate-100 px-1 rounded text-amber-700">rerank-2.5</code> model — the
          same provider as the embeddings, which ensures the representations are coherent. The API
          takes a query and a list of documents, and returns relevance scores.
        </p>

        <p className="text-sm font-medium text-slate-800 mb-2">API request</p>
        <CodeBlock
          code={`POST https://api.voyageai.com/v1/rerank
Authorization: Bearer <VOYAGE_API_KEY>

{
  "model":     "rerank-2.5",
  "query":     "Quand a commencé l'Orient-Express ?",
  "documents": [
    "Sherwood S., 1984, Venise Simplon Orient-Express...",
    "Le Venice Simplon Orient-Express circule encore...",
    "Il y a ensuite un transbordement dans les premières années...",
    ...  // up to 24 candidate chunks
  ]
}`}
        />

        <p className="text-sm font-medium text-slate-800 mt-4 mb-2">API response</p>
        <CodeBlock
          code={`{
  "data": [
    { "index": 5,  "relevance_score": 0.94 },  // ← chunk about 1883
    { "index": 12, "relevance_score": 0.81 },
    { "index": 2,  "relevance_score": 0.63 },
    ...
  ]
}`}
        />

        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            The adapter sorts results by{" "}
            <code className="bg-slate-100 px-1 rounded">relevance_score</code> descending and
            returns the list of <code className="bg-slate-100 px-1 rounded">index</code> values.
            Each index maps back to the original candidate array, so the final chunks preserve their
            full content and metadata.
          </p>
          <Callout type="tip">
            The <code>relevance_score</code> from a cross-encoder is not comparable to a cosine
            similarity score. It is an internal calibrated score; only the ranking order matters,
            not the absolute value.
          </Callout>
        </div>
      </Card>
    </>
  );
}
