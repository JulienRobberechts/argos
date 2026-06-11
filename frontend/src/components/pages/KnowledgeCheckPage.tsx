import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Code2,
  GitCompare,
  Quote,
  BarChart2,
  Layers,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../ui/PageHeader";

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
  color = "teal",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color?: "teal" | "purple" | "blue";
}) {
  const colors = {
    teal: "bg-teal-100 text-teal-700",
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}
      >
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

function StrategyBadge({
  label,
  color,
}: {
  label: string;
  color: "teal" | "purple" | "blue";
}) {
  const colors = {
    teal: "bg-teal-100 text-teal-800 border-teal-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <span
      className={`inline-block border rounded-full px-3 py-0.5 text-xs font-semibold ${colors[color]}`}
    >
      {label}
    </span>
  );
}

export default function KnowledgeCheckPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-4">
        <Link
          to="/technical"
          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
        >
          ← How RAG Works
        </Link>
      </div>

      <PageHeader
        icon={<ShieldCheck className="text-teal-600" size={28} />}
        title="Knowledge Check — Technical Deep Dive"
        info="Three strategies to detect whether an LLM answer comes from retrieved documents or from the model's training data."
      />

      {/* ── PROBLEM ──────────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<AlertTriangle size={20} />}
          title="The problem: parametric vs contextual knowledge"
          subtitle="Why a correct answer can still be the wrong answer"
          color="teal"
        />
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          In a RAG system the LLM receives retrieved chunks as context. Ideally
          its answer is grounded in those chunks. But LLMs also carry{" "}
          <strong>parametric knowledge</strong> — facts baked into their weights
          during training. When retrieval fails (low scores, missing documents),
          the model silently falls back to training data and still produces a
          confident answer.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">
            Concrete example from this project
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Query:{" "}
            <em className="text-teal-800">
              "Quand a commencé l'Orient-Express ?"
            </em>
          </p>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            The retrieved chunks only contain a bibliography reference. The LLM
            answers <em>"1883, Nagelmackers"</em> — correct, but sourced from
            training data, not from the documents. The RAG pipeline silently
            failed without anyone noticing.
          </p>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          Research (2025) on mechanistic interpretability confirms why this is
          hard to detect:
        </p>
        <blockquote className="border-l-4 border-teal-300 pl-4 text-sm text-gray-600 italic mb-4">
          "Parametric and contextual knowledge are routed through largely
          distinct attention circuits and coexist as superposed signals, with
          conflicts resolved through differential accumulation of signal
          strength across layers."
        </blockquote>
        <p className="text-sm text-gray-600 leading-relaxed">
          There is no separate "reading from doc" register inside the model. The
          two knowledge sources are blended in the same forward pass — which is
          why the three strategies below work at the{" "}
          <strong>output level</strong> (post-generation), not by peeking into
          the model internals.
        </p>
      </Card>

      {/* ── STRATEGY 1: FAITHFULNESS ─────────────────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <SectionTitle
            icon={<BarChart2 size={20} />}
            title="Strategy 1 — Faithfulness (RAGAS)"
            subtitle="Decompose the answer into atomic claims, verify each one against sources"
            color="teal"
          />
        </div>
        <div className="mb-3">
          <StrategyBadge label="faithfulness" color="teal" />
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          A second LLM call (the <em>judge</em>) receives the original question,
          the retrieved chunks, and the generated answer. It extracts every
          factual claim from the answer and checks whether each claim is
          explicitly stated in the sources.
        </p>

        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-2">
            Score formula
          </p>
          <p className="text-sm font-mono text-teal-900">
            score = supported_claims / total_claims
          </p>
          <p className="text-xs text-teal-700 mt-1">
            score = 1.0 → fully grounded · score = 0 → fully from training data
          </p>
        </div>

        <p className="text-sm font-medium text-gray-800 mb-2">Judge prompt</p>
        <CodeBlock
          code={`Question: "Quand a commencé l'Orient-Express ?"

Sources provided:
Sherwood S., 1984, Venise Simplon Orient-Express...
---
Le Venice Simplon Orient-Express circule encore...

Answer to evaluate: "L'Orient-Express a été lancé en 1883 par Nagelmackers."

For each factual claim in the answer, indicate whether it is explicitly
supported by the sources above.
Reply ONLY with valid JSON:
{
  "claims": [
    {"claim": "lancé en 1883", "status": "UNSUPPORTED", "sourceExcerpt": null},
    {"claim": "par Nagelmackers", "status": "UNSUPPORTED", "sourceExcerpt": null}
  ]
}`}
        />

        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            In the example above both claims are <strong>UNSUPPORTED</strong> —
            the bibliography chunk doesn't contain the date or the founder's
            name. Score = 0/2 = 0. Clear signal that the answer came from
            training data.
          </p>
          <Callout type="warning">
            Faithfulness measures grounding, not correctness. A score of 0 does
            not mean the answer is wrong — it means it isn't traceable to the
            retrieved documents.
          </Callout>
        </div>
      </Card>

      {/* ── STRATEGY 2: COUNTERFACTUAL ───────────────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <SectionTitle
            icon={<GitCompare size={20} />}
            title="Strategy 2 — Counterfactual"
            subtitle="Ask the same question without context — if the answer is the same, RAG didn't help"
            color="purple"
          />
        </div>
        <div className="mb-3">
          <StrategyBadge label="counterfactual" color="purple" />
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          The strategy generates two answers to the same question — one with the
          retrieved chunks (the RAG answer), one without any context (training
          only). A judge then compares the two.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Answer A — with context
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              LLM receives the retrieved chunks + question. Uses contextual
              knowledge.
            </p>
            <div className="mt-2 bg-gray-50 rounded p-2 text-xs font-mono text-gray-700">
              "L'Orient-Express a été lancé en 1883…"
            </div>
          </div>
          <div className="border border-purple-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
              Answer B — without context
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Same question, no documents. LLM can only draw on training data.
            </p>
            <div className="mt-2 bg-gray-50 rounded p-2 text-xs font-mono text-gray-700">
              "L'Orient-Express a été inauguré en 1883…"
            </div>
          </div>
        </div>

        <p className="text-sm font-medium text-gray-800 mb-2">
          Comparison judge prompt
        </p>
        <CodeBlock
          code={`Question: "Quand a commencé l'Orient-Express ?"

Answer A (with retrieved documents): "L'Orient-Express a été lancé en 1883 par Nagelmackers."
Answer B (training knowledge only):  "L'Orient-Express a été inauguré en 1883..."

Do these two answers convey essentially the same information?
Reply ONLY with valid JSON:
{"similar": true, "reasoning": "Both answers state the same date and origin."}`}
        />

        <div className="mt-4 space-y-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-2">
              Score interpretation
            </p>
            <div className="space-y-1 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <span className="w-20 font-mono font-semibold text-purple-700">
                  similar = true
                </span>
                <ArrowRight size={12} className="text-gray-400" />
                <span>
                  score = 0 — RAG didn't add information beyond training data
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 font-mono font-semibold text-teal-700">
                  similar = false
                </span>
                <ArrowRight size={12} className="text-gray-400" />
                <span>
                  score = 1 — the context genuinely influenced the answer
                </span>
              </div>
            </div>
          </div>
          <Callout type="info">
            This strategy costs <strong>2× the LLM latency</strong>: one call to
            generate answer B, one call for the comparison judge. It is the most
            expensive of the three but the most direct signal of whether
            retrieval actually contributed.
          </Callout>
        </div>
      </Card>

      {/* ── STRATEGY 3: CITATION FORCING ─────────────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <SectionTitle
            icon={<Quote size={20} />}
            title="Strategy 3 — Citation Forcing"
            subtitle="Demand an exact quote for every claim — then verify the quote actually exists"
            color="blue"
          />
        </div>
        <div className="mb-3">
          <StrategyBadge label="citation_forcing" color="blue" />
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          The judge is asked to map every factual claim in the answer to an{" "}
          <em>exact quote</em> from the numbered source list. Claims without a
          traceable quote are marked UNSUPPORTED. Crucially, the adapter then{" "}
          <strong>verifies</strong> each reported excerpt against the actual
          chunk text — LLMs hallucinate citations, so the quote must be found
          verbatim.
        </p>

        <p className="text-sm font-medium text-gray-800 mb-2">Judge prompt</p>
        <CodeBlock
          code={`Question: Quand a commencé l'Orient-Express ?

Available sources:
SOURCE 1:
Sherwood S., 1984, Venise Simplon Orient-Express...

SOURCE 2:
Le Venice Simplon Orient-Express circule encore aujourd'hui...

Answer to analyze: "L'Orient-Express a été lancé en 1883 par Nagelmackers."

For each factual claim in the answer, find the exact supporting quote.
If no source supports a claim, set status to "UNSUPPORTED".
Reply ONLY with valid JSON:
{
  "claims": [
    {"claim": "lancé en 1883", "status": "UNSUPPORTED", "sourceExcerpt": null},
    {"claim": "par Nagelmackers", "status": "UNSUPPORTED", "sourceExcerpt": null}
  ]
}`}
        />

        <p className="text-sm font-medium text-gray-800 mt-4 mb-2">
          Hallucination guard
        </p>
        <CodeBlock
          code={`// application/CheckContextualKnowledge.ts (simplified)

const claims = parsed.claims.map((c) => {
  if (c.status !== "SUPPORTED" || !c.sourceExcerpt) {
    return { claim: c.claim, status: "UNSUPPORTED" };
  }
  // Verify the excerpt actually exists in the chunks
  const verified = chunkTexts.some((text) =>
    text.includes(c.sourceExcerpt.slice(0, 40))  // first 40 chars
  );
  return {
    claim: c.claim,
    status: verified ? "SUPPORTED" : "UNSUPPORTED",
    sourceExcerpt: verified ? c.sourceExcerpt : undefined,
  };
});`}
        />

        <div className="mt-4">
          <Callout type="warning">
            Without the hallucination guard, a citation-forcing score of 1.0
            could be meaningless — the LLM may have invented plausible-looking
            quotes. The guard uses a 40-character prefix match to keep the check
            fast while still catching invented excerpts.
          </Callout>
        </div>
      </Card>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<Layers size={20} />}
          title="Strategy comparison"
          subtitle="Choosing the right check for your use case"
          color="teal"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Strategy
                </th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  LLM calls
                </th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Signal
                </th>
                <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Best for
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">
                  <StrategyBadge label="faithfulness" color="teal" />
                </td>
                <td className="py-3 pr-4 text-xs text-gray-700">1</td>
                <td className="py-3 pr-4 text-xs text-gray-600">
                  Fraction of claims grounded in sources
                </td>
                <td className="py-3 text-xs text-gray-600">
                  General grounding check, low overhead
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">
                  <StrategyBadge label="counterfactual" color="purple" />
                </td>
                <td className="py-3 pr-4 text-xs text-gray-700">2</td>
                <td className="py-3 pr-4 text-xs text-gray-600">
                  Did retrieval actually change the answer?
                </td>
                <td className="py-3 text-xs text-gray-600">
                  Detecting silent RAG failure
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <StrategyBadge label="citation_forcing" color="blue" />
                </td>
                <td className="py-3 pr-4 text-xs text-gray-700">1</td>
                <td className="py-3 pr-4 text-xs text-gray-600">
                  Exact source quote per claim (verified)
                </td>
                <td className="py-3 text-xs text-gray-600">
                  Audit trail, explainability
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Callout type="tip">
            All three strategies can run in parallel since they are independent
            LLM calls. The results are stored alongside the message in the{" "}
            <code className="bg-gray-100 px-1 rounded">knowledgeCheck</code>{" "}
            field and displayed below the answer in the chat UI.
          </Callout>
        </div>
      </Card>

      {/* ── IMPLEMENTATION ───────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<Code2 size={20} />}
          title="Implementation — CheckContextualKnowledge"
          subtitle="How the three strategies are orchestrated"
          color="teal"
        />
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          The{" "}
          <code className="bg-gray-100 px-1 rounded text-teal-700">
            CheckContextualKnowledge
          </code>{" "}
          use case runs after the LLM has generated its answer. It loops over
          the requested strategies and accumulates results. A failed strategy
          returns <code className="bg-gray-100 px-1 rounded">score = -1</code>{" "}
          with a warning rather than crashing the request.
        </p>
        <CodeBlock
          code={`// application/CheckContextualKnowledge.ts (simplified)

async run(
  query: string,
  answer: string,
  chunks: ChunkSearchResult[],
  strategies: KnowledgeCheckStrategy[],
): Promise<KnowledgeCheckResult[]> {
  const results: KnowledgeCheckResult[] = [];

  for (const strategy of strategies) {
    try {
      if (strategy === "faithfulness")
        results.push(await this.faithfulness(query, answer, chunks));
      else if (strategy === "counterfactual")
        results.push(await this.counterfactual(query, answer));
      else if (strategy === "citation_forcing")
        results.push(await this.citationForcing(query, answer, chunks));
    } catch (err) {
      results.push({ strategy, score: -1, claims: [], warning: String(err) });
    }
  }
  return results;
}`}
        />
        <div className="mt-4">
          <Callout type="info">
            <code>KnowledgeCheckStrategy</code> is a discriminated union:{" "}
            <code className="ml-1">
              "faithfulness" | "counterfactual" | "citation_forcing"
            </code>
            . The results are stored in the{" "}
            <code className="ml-1">messages.knowledge_check</code> JSONB column
            and exposed via the conversations API.
          </Callout>
        </div>
      </Card>

      {/* ── DOMAIN TYPES ─────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<Info size={20} />}
          title="Domain types"
          subtitle="The shared data structures used across the stack"
          color="teal"
        />
        <CodeBlock
          code={`// domain/entities/Message.ts

export type KnowledgeCheckStrategy =
  | "faithfulness"
  | "counterfactual"
  | "citation_forcing";

export interface KnowledgeClaim {
  claim: string;
  status: "SUPPORTED" | "UNSUPPORTED";
  sourceExcerpt?: string;   // only present for citation_forcing
}

export interface KnowledgeCheckResult {
  strategy: KnowledgeCheckStrategy;
  score: number;           // 0–1, or -1 if the check failed
  claims: KnowledgeClaim[];
  warning?: string;        // shown in the UI when score < 1
}

export interface Message {
  ...
  knowledgeCheck?: KnowledgeCheckResult[];  // one entry per strategy
}`}
        />
      </Card>

      {/* ── TRADE-OFFS ───────────────────────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon={<AlertTriangle size={20} />}
          title="Trade-offs and limitations"
          subtitle="What these checks can and cannot tell you"
          color="teal"
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-teal-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-2">
              These checks are useful when…
            </p>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex gap-2">
                <CheckCircle
                  size={12}
                  className="text-teal-500 mt-0.5 flex-shrink-0"
                />
                You need an audit trail for regulated domains (legal, medical)
              </li>
              <li className="flex gap-2">
                <CheckCircle
                  size={12}
                  className="text-teal-500 mt-0.5 flex-shrink-0"
                />
                Retrieval quality is uncertain (new documents, low scores)
              </li>
              <li className="flex gap-2">
                <CheckCircle
                  size={12}
                  className="text-teal-500 mt-0.5 flex-shrink-0"
                />
                You want to identify gaps in your knowledge base automatically
              </li>
              <li className="flex gap-2">
                <CheckCircle
                  size={12}
                  className="text-teal-500 mt-0.5 flex-shrink-0"
                />
                You need to trigger fallback strategies on low-score answers
              </li>
            </ul>
          </div>
          <div className="border border-amber-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
              These checks won't tell you…
            </p>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex gap-2">
                <AlertTriangle
                  size={12}
                  className="text-amber-500 mt-0.5 flex-shrink-0"
                />
                Whether the answer is factually correct
              </li>
              <li className="flex gap-2">
                <AlertTriangle
                  size={12}
                  className="text-amber-500 mt-0.5 flex-shrink-0"
                />
                Whether the retrieved chunks themselves are accurate
              </li>
              <li className="flex gap-2">
                <AlertTriangle
                  size={12}
                  className="text-amber-500 mt-0.5 flex-shrink-0"
                />
                Whether the LLM judge is itself hallucinating claims
              </li>
              <li className="flex gap-2">
                <AlertTriangle
                  size={12}
                  className="text-amber-500 mt-0.5 flex-shrink-0"
                />
                Why retrieval failed (missing doc, wrong chunking, bad
                embedding)
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
