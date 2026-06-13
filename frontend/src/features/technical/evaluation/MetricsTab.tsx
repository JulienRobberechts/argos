import { Scale, MessageCircle, Search } from "lucide-react";
import Card from "../../../components/ui/Card";
import SectionTitle from "../../../components/ui/SectionTitle";
import CodeBlock from "../../../components/ui/CodeBlock";
import Callout from "../../../components/ui/Callout";

function FormulaBox({ formula }: { formula: string }) {
  return (
    <div className="bg-slate-900 rounded-lg px-5 py-3 my-4 font-mono text-sm text-amber-300 text-center">
      {formula}
    </div>
  );
}

export default function MetricsTab() {
  return (
    <>
      <Card className="mb-6">
        <SectionTitle
          icon={<Scale size={20} />}
          title="Faithfulness"
          subtitle="Does the answer contain only what the sources say?"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-2">
          Faithfulness measures whether every factual claim in the generated
          answer is explicitly supported by the retrieved chunks. A score below
          1.0 means the LLM introduced information from its training weights.
        </p>
        <FormulaBox formula="Faithfulness = supported claims / total claims in the answer" />

        <p className="text-sm font-medium text-slate-800 mb-2">
          How it works (LLM-as-judge)
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 mb-4">
          <li>
            Extract every factual claim from the answer as an atomic statement.
          </li>
          <li>
            For each claim, check whether it can be directly inferred from the
            retrieved chunks.
          </li>
          <li>Score = proportion of supported claims.</li>
        </ol>

        <CodeBlock
          code={`// Faithfulness prompt (simplified)
For each factual claim in this answer, indicate whether it is
explicitly supported by the sources below.

Answer: "The Orient-Express was created by Nagelmackers in 1883."
Sources: [chunk 1, chunk 2, ...]

Reply ONLY with valid JSON:
{
  "claims": [
    { "claim": "Created by Nagelmackers", "status": "SUPPORTED", "sourceExcerpt": "..." },
    { "claim": "in 1883",               "status": "SUPPORTED", "sourceExcerpt": "..." }
  ]
}`}
        />

        <Callout type="tip">
          <strong>Already implemented</strong> in this project:{" "}
          <code>src/application/responseChecks/strategies/faithfulness.ts</code>
          . The eval scorer is a direct wrapper — no duplication needed.
        </Callout>
      </Card>

      <Card className="mb-6">
        <SectionTitle
          icon={<MessageCircle size={20} />}
          title="Answer Relevance"
          subtitle="Does the answer actually respond to the question asked?"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-2">
          Answer relevance catches cases where the LLM answers{" "}
          <em>something</em> related but not the actual question — common when
          retrieved chunks are broadly relevant but don't contain the precise
          information sought.
        </p>
        <FormulaBox formula="AnswerRelevance = cosine_similarity(original_question, regenerated_question)" />

        <p className="text-sm font-medium text-slate-800 mb-2">
          How it works (embedding-based)
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 mb-4">
          <li>
            Ask the LLM: <em>"What question does this answer respond to?"</em>
          </li>
          <li>
            Embed both the original question and the regenerated question via{" "}
            <code className="bg-slate-100 px-1 rounded">
              VoyageEmbeddingAdapter
            </code>
            .
          </li>
          <li>Cosine similarity between the two vectors = relevance score.</li>
        </ol>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            Example — low relevance
          </p>
          <p className="text-xs text-slate-600 mb-1">
            Original:{" "}
            <em>"What caused the end of the Direct Orient-Express service?"</em>
          </p>
          <p className="text-xs text-slate-600 mb-1">
            Answer:{" "}
            <em>"The Orient-Express ran at barely 55 km/h at the end."</em>
          </p>
          <p className="text-xs text-slate-600 mb-1">
            Regenerated: <em>"How fast was the Orient-Express?"</em>
          </p>
          <p className="text-xs font-semibold text-amber-800 mt-2">
            Similarity ≈ 0.40 → low relevance, answer is off-topic
          </p>
        </div>

        <CodeBlock
          code={`function cosineSimilarity(a: number[], b: number[]): number {
  const dot  = a.reduce((s, v, i) => s + v * b[i], 0);
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return dot / (norm(a) * norm(b));
}`}
        />
      </Card>

      <Card className="mb-6">
        <SectionTitle
          icon={<Search size={20} />}
          title="Context Recall"
          subtitle="Did the retrieval surface the information needed to answer?"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-2">
          Context recall measures whether the retrieved chunks contain the
          information required to produce the reference answer. A low score
          points to a <strong>retrieval failure</strong> — the right documents
          were in the knowledge base but were not surfaced.
        </p>
        <FormulaBox formula="ContextRecall = claims from expected_answer covered by chunks / total claims" />

        <p className="text-sm font-medium text-slate-800 mb-2">
          How it works (LLM-as-judge, requires reference answer)
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 mb-4">
          <li>
            Decompose{" "}
            <code className="bg-slate-100 px-1 rounded">expected_answer</code>{" "}
            into atomic claims.
          </li>
          <li>
            For each claim, check whether at least one retrieved chunk supports
            it.
          </li>
          <li>Score = proportion of claims covered.</li>
        </ol>

        <CodeBlock
          code={`// Step 1 — decompose the reference answer into atomic claims
Decompose this answer into individual atomic facts.
Reply ONLY with JSON: { "claims": ["fact 1", "fact 2", ...] }
Answer: "Service ended in 1977 due to competition from mass aviation."

→ { "claims": ["ended in 1977", "aviation competition"] }

// Step 2 — check each claim against retrieved chunks
Is the following claim covered by at least one of these excerpts?
Claim: "ended in 1977"
Excerpts: [chunk 1 content, chunk 2 content, ...]
Reply ONLY with JSON: { "covered": true }`}
        />

        <Callout type="warning">
          Context recall requires a labeled <code>expected_answer</code>. Write
          reference answers by reading the source document — never by asking the
          LLM. An LLM-generated reference inherits the same blind spots as the
          model being evaluated.
        </Callout>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-slate-800 mb-3">
          Score interpretation guide
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Metric
                </th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Score
                </th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Signal
                </th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600">
              {[
                [
                  "Faithfulness",
                  "< 0.80",
                  "LLM is hallucinating — check retrieval quality and prompt",
                ],
                [
                  "Answer Relevance",
                  "< 0.70",
                  "Chunks are off-topic — check chunk size and embedding model",
                ],
                [
                  "Context Recall",
                  "< 0.70",
                  "Retrieval is incomplete — lower min-score, increase limit, or use hybrid search",
                ],
                [
                  "All three",
                  "low",
                  "End-to-end failure — check ingestion and embedding pipeline",
                ],
              ].map(([metric, score, signal]) => (
                <tr key={metric} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-700">
                    {metric}
                  </td>
                  <td className="py-2 pr-4 font-mono text-amber-700">
                    {score}
                  </td>
                  <td className="py-2 text-slate-500">{signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
