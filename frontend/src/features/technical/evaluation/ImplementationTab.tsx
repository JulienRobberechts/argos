import { ArrowRight, Code2, Layers } from "lucide-react";
import Callout from "../../../components/ui/Callout";
import Card from "../../../components/ui/Card";
import CodeBlock from "../../../components/ui/CodeBlock";
import ParamRow from "../../../components/ui/ParamRow";
import SectionTitle from "../../../components/ui/SectionTitle";

type FlowBoxColor = "yellow" | "amber" | "green" | "slate";

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
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
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

export default function ImplementationTab() {
  return (
    <>
      <Card className="mb-6">
        <SectionTitle
          icon={<Layers size={20} />}
          title="Evaluation pipeline"
          subtitle="What happens for each question in the dataset"
        />

        <div className="flex flex-col gap-1 mb-6">
          <FlowBox label="dataset.json" sub="14 labeled Q/A pairs" color="yellow" />
          <Arrow />
          <FlowBox
            label="SearchKnowledge.execute(question)"
            sub="hybrid search + reranking → top-8 chunks"
            color="amber"
          />
          <Arrow />
          <FlowBox
            label="AnthropicLLMAdapter.stream(prompt + chunks)"
            sub="generates rag_answer"
            color="amber"
          />
          <Arrow />
          <FlowBox
            label="scoreFaithfulness + scoreAnswerRelevance + scoreContextRecall"
            sub="3 independent LLM/embedding judge calls"
            color="amber"
          />
          <Arrow />
          <FlowBox
            label="Results table printed to stdout"
            sub="per-question scores + global averages"
            color="green"
          />
        </div>

        <Callout type="info">
          Use <code>SearchKnowledge</code> directly — not <code>AskQuestion</code>. The latter
          writes to the conversation database and generates titles, neither of which is needed for
          offline eval.
        </Callout>
      </Card>

      <Card className="mb-6">
        <SectionTitle
          icon={<Code2 size={20} />}
          title="Dataset structure"
          subtitle="tests/eval/dataset.json — 14 pairs across 2 corpora"
        />
        <CodeBlock
          code={`// Each entry in dataset.json
{
  "id": "oe-01",
  "dataset": "orient-express",   // or "val-en-selve"
  "difficulty": "easy",          // "easy" | "medium" | "hard"
  "question": "Who founded the Compagnie Internationale des Wagons-Lits?",
  "expected_answer": "Georges Nagelmackers, a Belgian engineer, founded the CIWL in 1876.",
  "document_ids": ["Orient-Express/orient-express.md"]
}`}
        />

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            {
              label: "Orient-Express",
              count: "7",
              color: "border-amber-200 bg-amber-50 text-amber-800",
            },
            {
              label: "Val-en-Selve",
              count: "7",
              color: "border-green-200 bg-green-50 text-green-800",
            },
            {
              label: "Multi-document",
              count: "4",
              color: "border-slate-200 bg-slate-50 text-slate-600",
            },
          ].map(({ label, count, color }) => (
            <div key={label} className={`border rounded-lg p-3 text-center ${color}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Callout type="warning">
            <code>document_ids</code> currently contain relative file paths, not vector database
            IDs. Mapping to real IDs is required after ingesting the demo documents into the
            knowledge base.
          </Callout>
        </div>
      </Card>

      <Card className="mb-6">
        <SectionTitle
          icon={<Code2 size={20} />}
          title="File structure"
          subtitle="Where each scorer lives"
        />
        <CodeBlock
          code={`devknowledge/backend/tests/eval/
  dataset.json                  ✅ created — 14 labeled pairs
  run.ts                        main script — npm run eval
  scorers/
    faithfulness.ts             wrapper around checkFaithfulness (already implemented)
    answerRelevance.ts          LLM regeneration + cosine similarity
    contextRecall.ts            claim decomposition + chunk coverage`}
        />

        <p className="text-sm font-medium text-slate-800 mt-4 mb-2">
          Add to <code>package.json</code>
        </p>
        <CodeBlock code={`"eval": "tsx tests/eval/run.ts"`} />

        <p className="text-sm font-medium text-slate-800 mt-4 mb-2">Expected stdout output</p>
        <CodeBlock
          code={`ID        Dataset          Diff    Faith  Relev  Recall
oe-01     orient-express   easy    1.00   0.92   0.88
oe-05     orient-express   hard    0.83   0.79   0.91
vs-02     val-en-selve     medium  1.00   0.85   0.72
vs-04     val-en-selve     hard    0.91   0.77   0.68
...
──────────────────────────────────────────────────────
Average                            0.92   0.83   0.81`}
        />
      </Card>

      <Card>
        <SectionTitle
          icon={<Code2 size={20} />}
          title="Environment variables"
          subtitle="Required to run npm run eval"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Env var
                </th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Required
                </th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Used for
                </th>
              </tr>
            </thead>
            <tbody>
              <ParamRow
                name="ANTHROPIC_API_KEY"
                value="yes"
                description="LLM generation (Haiku) and all three judge calls (faithfulness, answer relevance, context recall)"
              />
              <ParamRow
                name="VOYAGE_API_KEY"
                value="yes"
                description="Query embedding (SearchKnowledge), reranking (VoyageRerankAdapter), answer relevance cosine similarity"
              />
              <ParamRow
                name="DATABASE_URL"
                value="yes"
                description="PgVectorChunkRepository — demo documents must already be ingested before running eval"
              />
              <ParamRow
                name="SEARCH_MODE"
                value="hybrid"
                description="Leave as hybrid for realistic eval. Set to 'vector' for a reproducible baseline without BM25."
              />
              <ParamRow
                name="RETRIEVAL_LIMIT"
                value="8"
                description="Number of chunks sent to the LLM and used by all scorers."
              />
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
