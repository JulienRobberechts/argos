import { AlertTriangle, CheckCircle } from "lucide-react";
import Card from "../../../components/ui/Card";
import SectionTitle from "../../../components/ui/SectionTitle";
import CodeBlock from "../../../components/ui/CodeBlock";
import Callout from "../../../components/ui/Callout";

export default function OverviewTab() {
  return (
    <>
      <Card className="mb-6">
        <SectionTitle
          icon={<AlertTriangle size={20} />}
          title="The problem with vector search alone"
          subtitle="Why a score of 0.92 can still be the wrong chunk"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          Vector search computes the cosine similarity between a{" "}
          <strong>question vector</strong> and each{" "}
          <strong>chunk vector</strong>. Both vectors are produced independently
          — the model never sees the question and the chunk together. This is
          called a <em>bi-encoder</em> architecture and it is fast, but it
          trades precision for speed.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">
            Concrete example from this project
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Query:{" "}
            <em className="text-amber-800">
              "Quand a commencé l'Orient-Express ?"
            </em>
          </p>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            The top-ranked chunk contains only a bibliography reference
            (Sherwood, 1984) — score <strong>0.39</strong>. The chunk that
            actually says <em>"lancé en 1883"</em> ranks lower because the
            embedding of a question about a start date is geometrically far from
            the embedding of a sentence about history, even though the sentence
            is the correct answer.
          </p>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          This mismatch happens because:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
          <li>
            A <strong>question</strong> and its <strong>answer</strong> have
            different linguistic structures — they don't look alike in embedding
            space.
          </li>
          <li>
            Chunks containing specific facts (dates, names, numbers) are short
            and dense — their vectors capture the surrounding narrative more
            than the fact itself.
          </li>
          <li>
            The bi-encoder can't reason about the pair (question, chunk) — it
            only compares individual vectors.
          </li>
        </ul>
      </Card>

      <Card>
        <SectionTitle
          icon={<CheckCircle size={20} />}
          title="The solution: cross-encoder re-ranking"
          subtitle="Seeing the question and the chunk together"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          A <strong>cross-encoder</strong> is a model that takes the{" "}
          <em>concatenation</em> of the question and a chunk as input, and
          outputs a single relevance score. Because it reads both texts
          simultaneously, it can reason about their relationship — not just
          their individual meanings.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Bi-encoder (vector search)
            </p>
            <CodeBlock
              code={`embed(question) → q_vec
embed(chunk)    → c_vec
score = cosine(q_vec, c_vec)

# question and chunk never
# seen together`}
            />
          </div>
          <div className="border border-amber-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
              Cross-encoder (re-ranker)
            </p>
            <CodeBlock
              code={`score = model(
  "[question] [SEP] [chunk]"
)

# model reads BOTH texts
# at the same time`}
            />
          </div>
        </div>

        <Callout type="info">
          Cross-encoders are too slow to run against every chunk in the
          database. The standard pattern is a{" "}
          <strong>two-stage pipeline</strong>: fast bi-encoder to get ~20
          candidates, then accurate cross-encoder to re-order them.
        </Callout>
      </Card>
    </>
  );
}
