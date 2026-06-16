import { AlertTriangle, CheckCircle } from "lucide-react";
import Callout from "../../../components/ui/Callout";
import Card from "../../../components/ui/Card";
import SectionTitle from "../../../components/ui/SectionTitle";

type RiskItem = {
  title: string;
  description: string;
  mitigation: string;
  severity: "high" | "medium" | "low";
};

const RISKS: RiskItem[] = [
  {
    title: "LLM judge self-grading bias",
    description:
      "When the same model generates the answer and judges it, it tends to rate its own output favorably — even when that output is wrong. The faithfulness prompt uses a separate, low-temperature call, but the underlying model is still Claude in both roles.",
    mitigation:
      "Use a weaker model for generation (Haiku) and a stronger one for judging (Sonnet). Different temperatures also help: 0.1 for generation, 0 for judging.",
    severity: "high",
  },
  {
    title: "Metric gaming",
    description:
      "Maximizing faithfulness can hurt answer quality. A system that returns the retrieved chunk verbatim scores 1.0 on faithfulness but 0.0 on usefulness. Watch for: faithfulness ↑ while answer relevance ↓ — the LLM is parroting chunks without addressing the question.",
    mitigation:
      "Always read the three metrics together, never in isolation. A score drop in one metric while another rises is a signal, not an improvement.",
    severity: "high",
  },
  {
    title: "Cost per evaluation run",
    description:
      "Each question in the dataset requires: 1 embedding + 1 RAG pipeline + 1 LLM generation + 3 LLM judge calls. For 14 questions this is ~70–100 API calls per run. At Haiku pricing this is negligible individually but rules out running eval on every commit.",
    mitigation:
      "Use workflow_dispatch in CI (manual trigger), not on: push. Reserve automatic eval for release branches.",
    severity: "medium",
  },
  {
    title: "Chunk boundary sensitivity",
    description:
      "Context recall is sensitive to how documents are chunked. The same information can be split across two chunks, with each half below the similarity threshold. A context recall of 0.6 may indicate chunking issues rather than retrieval failure.",
    mitigation:
      "Run eval after changing chunking parameters and compare deltas. The project's ChunkingStrategies.cases.ts already supports this kind of regression tracking.",
    severity: "medium",
  },
  {
    title: "Dataset leakage",
    description:
      "If eval questions are derived from the same documents ingested into the knowledge base, the system is tested on its own training data. This validates coverage, not generalization — which is intentional for a demo RAG but should be stated explicitly.",
    mitigation:
      "For generalization testing, hold out a set of documents from ingestion and build eval questions from them. Not required for a demo project.",
    severity: "low",
  },
  {
    title: "Reference answer quality",
    description:
      "Context recall is only as good as the expected_answer. If the reference is incomplete or uses different phrasing than the source, the metric underestimates actual recall. LLM-generated references inherit the same blind spots as the model being evaluated.",
    mitigation:
      "Write expected_answer by reading the source document directly. Never generate reference answers with the same model used for generation.",
    severity: "low",
  },
];

const SEVERITY_STYLES = {
  high: "border-red-200 bg-red-50",
  medium: "border-amber-200 bg-amber-50",
  low: "border-slate-200 bg-slate-50",
};

const SEVERITY_LABEL_STYLES = {
  high: "text-red-700",
  medium: "text-amber-700",
  low: "text-slate-500",
};

export default function RisksTab() {
  return (
    <>
      <Card className="mb-6">
        <SectionTitle
          icon={<AlertTriangle size={20} />}
          title="Evaluation pitfalls"
          subtitle="What can go wrong when measuring RAG quality"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          Evaluation metrics are proxies — they measure something correlated with quality, not
          quality itself. Understanding where they fail is as important as understanding what they
          measure.
        </p>

        <div className="space-y-3">
          {RISKS.map((risk) => (
            <div
              key={risk.title}
              className={`border rounded-lg p-4 ${SEVERITY_STYLES[risk.severity]}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-slate-800">{risk.title}</p>
                <span
                  className={`text-xs font-semibold uppercase tracking-wide flex-shrink-0 ${SEVERITY_LABEL_STYLES[risk.severity]}`}
                >
                  {risk.severity}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-2">{risk.description}</p>
              <div className="flex items-start gap-1.5">
                <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-medium text-slate-600">Mitigation: </span>
                  {risk.mitigation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon={<CheckCircle size={20} />}
          title="What good scores look like"
          subtitle="Targets for this project's dataset"
        />
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            {
              metric: "Faithfulness",
              target: "≥ 0.80",
              why: "CI threshold — below this, the LLM is hallucinating more than 1 in 5 claims",
            },
            {
              metric: "Answer Relevance",
              target: "≥ 0.75",
              why: "Below this, answers are consistently off-topic relative to the question asked",
            },
            {
              metric: "Context Recall",
              target: "≥ 0.70",
              why: "Below this, more than 30% of required information is missing from retrieved chunks",
            },
          ].map(({ metric, target, why }) => (
            <div key={metric} className="border border-green-200 bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                {metric}
              </p>
              <p className="text-2xl font-bold text-green-700 mb-1">{target}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{why}</p>
            </div>
          ))}
        </div>
        <Callout type="info">
          These thresholds apply to the demo dataset (14 well-formed questions on known documents).
          Real-world production thresholds should be calibrated against human-labeled judgments on
          live traffic samples — not just the offline eval set.
        </Callout>
      </Card>
    </>
  );
}
