import {
  ArrowUpDown,
  Search,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Code2,
  Layers,
} from "lucide-react";
import PageHeader from "../ui/PageHeader";
import TechnicalNav from "./TechnicalNav";

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">
      {code}
    </pre>
  );
}

function Callout({
  type,
  children,
}: {
  type: "info" | "tip" | "warning";
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    tip: "bg-green-50 border-green-200 text-green-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
  };
  const labels = { info: "Note", tip: "Tip", warning: "Important" };
  return (
    <div className={`border rounded-lg p-4 text-sm ${styles[type]}`}>
      <span className="font-semibold">{labels[type]}: </span>
      {children}
    </div>
  );
}

function ParamRow({
  name,
  value,
  description,
}: {
  name: string;
  value: string;
  description: string;
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2.5 pr-4 font-mono text-xs text-purple-700 whitespace-nowrap font-medium">
        {name}
      </td>
      <td className="py-2.5 pr-4 font-mono text-xs text-gray-700 whitespace-nowrap">
        {value}
      </td>
      <td className="py-2.5 text-xs text-gray-600">{description}</td>
    </tr>
  );
}

function FlowBox({
  label,
  sub,
  color = "purple",
}: {
  label: string;
  sub?: string;
  color?: "purple" | "blue" | "green" | "gray";
}) {
  const colors = {
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    gray: "bg-gray-50 border-gray-200 text-gray-600",
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
    <div className="flex items-center justify-center text-gray-400 py-1">
      <ArrowRight size={16} />
    </div>
  );
}

export default function RerankingPage() {
  return (
    <div className="p-8 max-w-4xl">
      <TechnicalNav />

      <PageHeader
        icon={<ArrowUpDown className="text-purple-600" size={28} />}
        title="Re-ranking — Technical Deep Dive"
        info="Why vector search alone isn't enough, how a cross-encoder fixes it, and how Voyage rerank-2.5 is wired into this project."
      />

      {/* ── PROBLEM ──────────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<AlertTriangle size={20} />}
          title="The problem with vector search alone"
          subtitle="Why a score of 0.92 can still be the wrong chunk"
        />
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
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
          <p className="text-sm text-gray-700 leading-relaxed">
            Query:{" "}
            <em className="text-purple-800">
              "Quand a commencé l'Orient-Express ?"
            </em>
          </p>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            The top-ranked chunk contains only a bibliography reference
            (Sherwood, 1984) — score <strong>0.39</strong>. The chunk that
            actually says <em>"lancé en 1883"</em> ranks lower because the
            embedding of a question about a start date is geometrically far from
            the embedding of a sentence about history, even though the sentence
            is the correct answer.
          </p>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          This mismatch happens because:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
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

      {/* ── SOLUTION ─────────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<CheckCircle size={20} />}
          title="The solution: cross-encoder re-ranking"
          subtitle="Seeing the question and the chunk together"
        />
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          A <strong>cross-encoder</strong> is a model that takes the{" "}
          <em>concatenation</em> of the question and a chunk as input, and
          outputs a single relevance score. Because it reads both texts
          simultaneously, it can reason about their relationship — not just
          their individual meanings.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
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
          <div className="border border-purple-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
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

      {/* ── TWO-STAGE PIPELINE ───────────────────────────────────────────────── */}
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
            color="blue"
          />
          <Arrow />
          <FlowBox
            label="Stage 1 — Vector search"
            sub={`embed(question, "query") → cosine search → top ${String(3 * 8)} candidates (3× limit)`}
            color="purple"
          />
          <Arrow />
          <FlowBox
            label="Stage 2 — Cross-encoder re-ranking"
            sub="Voyage rerank-2.5: score each (question, chunk) pair together"
            color="purple"
          />
          <Arrow />
          <FlowBox
            label="Top-8 re-ranked chunks"
            sub="Sent to the LLM as context"
            color="green"
          />
        </div>

        <p className="text-sm font-medium text-gray-800 mb-2">
          Why 3× candidates?
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Because vector search may rank the right chunks at positions 9–15
          (just outside the final limit), the first stage fetches{" "}
          <code className="bg-gray-100 px-1 rounded text-purple-700">
            limit × candidateMultiplier
          </code>{" "}
          candidates (default: 8 × 3 = 24). The re-ranker then sees a wider pool
          and can promote the best chunks to the top-8.
        </p>
        <p className="text-sm font-medium text-gray-800 mb-2">
          Score threshold during stage 1
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          When re-ranking is enabled, the first stage uses a more permissive
          cosine threshold:{" "}
          <code className="bg-gray-100 px-1 rounded text-purple-700">
            minScore × 0.5
          </code>
          . This casts a wider net so that relevant chunks with lower cosine
          similarity (but high cross-encoder relevance) are not discarded before
          the re-ranker ever sees them.
        </p>
      </Card>

      {/* ── VOYAGE RERANK ────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<Zap size={20} />}
          title="Voyage rerank-2.5 API"
          subtitle="The cross-encoder used in this project"
        />
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          This project uses Voyage AI's{" "}
          <code className="bg-gray-100 px-1 rounded text-purple-700">
            rerank-2.5
          </code>{" "}
          model — the same provider as the embeddings, which ensures the
          representations are coherent. The API takes a query and a list of
          documents, and returns relevance scores.
        </p>

        <p className="text-sm font-medium text-gray-800 mb-2">API request</p>
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

        <p className="text-sm font-medium text-gray-800 mt-4 mb-2">
          API response
        </p>
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
          <p className="text-sm text-gray-600 leading-relaxed">
            The adapter sorts results by{" "}
            <code className="bg-gray-100 px-1 rounded">relevance_score</code>{" "}
            descending and returns the list of{" "}
            <code className="bg-gray-100 px-1 rounded">index</code> values. Each
            index maps back to the original candidate array, so the final chunks
            preserve their full content and metadata.
          </p>
          <Callout type="tip">
            The <code>relevance_score</code> from a cross-encoder is not
            comparable to a cosine similarity score. It is an internal
            calibrated score; only the ranking order matters, not the absolute
            value.
          </Callout>
        </div>
      </Card>

      {/* ── CODE ─────────────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<Search size={20} />}
          title="Implementation — SearchKnowledge"
          subtitle="How the two stages are orchestrated"
        />
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          The{" "}
          <code className="bg-gray-100 px-1 rounded text-purple-700">
            SearchKnowledge
          </code>{" "}
          use case accepts an optional{" "}
          <code className="bg-gray-100 px-1 rounded text-purple-700">
            RerankPort
          </code>
          . When <code className="bg-gray-100 px-1 rounded">null</code>, it
          falls back to single-stage vector search.
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
            <code className="ml-1">
              rerank(query, documents): Promise&lt;number[]&gt;
            </code>
            . The returned array contains original indices sorted from most to
            least relevant. Swapping the reranker (e.g. Cohere instead of
            Voyage) requires only a new adapter — no changes to{" "}
            <code>SearchKnowledge</code>.
          </Callout>
        </div>
      </Card>

      {/* ── CONFIG ───────────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<Code2 size={20} />}
          title="Configuration"
          subtitle="Enabling, disabling, and tuning re-ranking"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Env var
                </th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Default
                </th>
                <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
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

      {/* ── TRADEOFFS ────────────────────────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon={<ArrowUpDown size={20} />}
          title="Trade-offs"
          subtitle="When re-ranking helps and when it doesn't"
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-green-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">
              Re-ranking helps most when…
            </p>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex gap-2">
                <CheckCircle
                  size={12}
                  className="text-green-500 mt-0.5 flex-shrink-0"
                />
                Questions ask for specific facts (dates, names, numbers)
              </li>
              <li className="flex gap-2">
                <CheckCircle
                  size={12}
                  className="text-green-500 mt-0.5 flex-shrink-0"
                />
                Documents are long and contain many related topics
              </li>
              <li className="flex gap-2">
                <CheckCircle
                  size={12}
                  className="text-green-500 mt-0.5 flex-shrink-0"
                />
                The query phrasing differs from the document phrasing
              </li>
              <li className="flex gap-2">
                <CheckCircle
                  size={12}
                  className="text-green-500 mt-0.5 flex-shrink-0"
                />
                High precision is more important than raw speed
              </li>
            </ul>
          </div>
          <div className="border border-amber-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
              Re-ranking adds less value when…
            </p>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex gap-2">
                <AlertTriangle
                  size={12}
                  className="text-amber-500 mt-0.5 flex-shrink-0"
                />
                The knowledge base is small (&lt; 100 chunks)
              </li>
              <li className="flex gap-2">
                <AlertTriangle
                  size={12}
                  className="text-amber-500 mt-0.5 flex-shrink-0"
                />
                Questions are broad / conceptual (vector search already works
                well)
              </li>
              <li className="flex gap-2">
                <AlertTriangle
                  size={12}
                  className="text-amber-500 mt-0.5 flex-shrink-0"
                />
                Latency is critical and &lt;100ms responses are required
              </li>
              <li className="flex gap-2">
                <AlertTriangle
                  size={12}
                  className="text-amber-500 mt-0.5 flex-shrink-0"
                />
                The relevant answer is simply absent from the documents
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
