import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Brain,
  Zap,
  Clock,
  DollarSign,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
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
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
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

type Tier = "flagship" | "performance" | "speed";

const TIER_COLORS: Record<Tier, string> = {
  flagship: "bg-purple-100 text-purple-800 border-purple-200",
  performance: "bg-blue-100 text-blue-800 border-blue-200",
  speed: "bg-green-100 text-green-800 border-green-200",
};

const TIER_LABELS: Record<Tier, string> = {
  flagship: "Flagship",
  performance: "Performance",
  speed: "Speed",
};

interface ModelSpec {
  id: string;
  name: string;
  tier: Tier;
  contextWindow: string;
  maxOutput: string;
  inputPrice: string;
  outputPrice: string;
  latency: string;
  knowledgeCutoff: string;
  adaptiveThinking: boolean;
  extendedThinking: boolean;
  bestFor: string[];
  limitations: string[];
}

const MODELS: ModelSpec[] = [
  {
    id: "claude-fable-5",
    name: "Claude Fable 5",
    tier: "flagship",
    contextWindow: "1M tokens",
    maxOutput: "128k tokens",
    inputPrice: "$10",
    outputPrice: "$50",
    latency: "Moderate",
    knowledgeCutoff: "—",
    adaptiveThinking: true,
    extendedThinking: false,
    bestFor: [
      "Most complex reasoning tasks",
      "Long-running agentic work",
      "Cases requiring the best available intelligence",
    ],
    limitations: [
      "Highest cost ($10/$50 per MTok)",
      "Higher latency than Sonnet/Haiku",
    ],
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    tier: "flagship",
    contextWindow: "1M tokens",
    maxOutput: "128k tokens",
    inputPrice: "$5",
    outputPrice: "$25",
    latency: "Moderate",
    knowledgeCutoff: "Jan 2026",
    adaptiveThinking: true,
    extendedThinking: false,
    bestFor: [
      "Complex multi-step reasoning",
      "Long-running agentic coding",
      "Deep analysis of long documents",
    ],
    limitations: [
      "High cost ($5/$25 per MTok)",
      "Higher latency than Sonnet/Haiku",
    ],
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    tier: "performance",
    contextWindow: "1M tokens",
    maxOutput: "64k tokens",
    inputPrice: "$3",
    outputPrice: "$15",
    latency: "Fast",
    knowledgeCutoff: "Aug 2025",
    adaptiveThinking: true,
    extendedThinking: true,
    bestFor: [
      "Best intelligence/speed/cost ratio",
      "RAG production applications",
      "Structured response generation",
    ],
    limitations: ["Lower max output than Opus (64k vs 128k)"],
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    tier: "speed",
    contextWindow: "200k tokens",
    maxOutput: "64k tokens",
    inputPrice: "$1",
    outputPrice: "$5",
    latency: "Fastest",
    knowledgeCutoff: "Feb 2025",
    adaptiveThinking: false,
    extendedThinking: true,
    bestFor: [
      "Low-latency responses",
      "High volume / reduced cost",
      "Simple document Q&A tasks",
    ],
    limitations: [
      "Smaller context window (200k)",
      "No adaptive thinking",
      "Older knowledge cutoff",
    ],
  },
];

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider border rounded px-1.5 py-0.5 ${TIER_COLORS[tier]}`}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

function ModelCard({ model }: { model: ModelSpec }) {
  const borderColor =
    model.tier === "flagship"
      ? "border-purple-200"
      : model.tier === "performance"
        ? "border-blue-200"
        : "border-green-200";

  return (
    <div className={`bg-white border ${borderColor} rounded-xl p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{model.name}</p>
          <code className="text-[11px] text-gray-400 font-mono">
            {model.id}
          </code>
        </div>
        <TierBadge tier={model.tier} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Layers size={12} className="text-gray-400 shrink-0" />
          <span>
            Context:{" "}
            <strong className="text-gray-800">{model.contextWindow}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <ArrowRight size={12} className="text-gray-400 shrink-0" />
          <span>
            Max output:{" "}
            <strong className="text-gray-800">{model.maxOutput}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <DollarSign size={12} className="text-gray-400 shrink-0" />
          <span>
            Input:{" "}
            <strong className="text-gray-800">{model.inputPrice}/MTok</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <DollarSign size={12} className="text-gray-400 shrink-0" />
          <span>
            Output:{" "}
            <strong className="text-gray-800">{model.outputPrice}/MTok</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <Clock size={12} className="text-gray-400 shrink-0" />
          <span>
            Latency: <strong className="text-gray-800">{model.latency}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <Brain size={12} className="text-gray-400 shrink-0" />
          <span>
            Cutoff:{" "}
            <strong className="text-gray-800">{model.knowledgeCutoff}</strong>
          </span>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {model.adaptiveThinking && (
          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5 font-medium">
            Adaptive thinking
          </span>
        )}
        {model.extendedThinking && (
          <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 rounded px-1.5 py-0.5 font-medium">
            Extended thinking
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider mb-1">
            Best for
          </p>
          <ul className="space-y-0.5">
            {model.bestFor.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-xs text-gray-600"
              >
                <CheckCircle
                  size={11}
                  className="text-green-500 mt-0.5 shrink-0"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">
            Limitations
          </p>
          <ul className="space-y-0.5">
            {model.limitations.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-xs text-gray-600"
              >
                <AlertTriangle
                  size={11}
                  className="text-amber-500 mt-0.5 shrink-0"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const TABS = ["Models", "Comparison", "RAG Usage", "Config"] as const;
type Tab = (typeof TABS)[number];

function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            active === t
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function isTab(value: string | null): value is Tab {
  return TABS.includes(value as Tab);
}

function ModelsTab() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {MODELS.map((m) => (
        <ModelCard key={m.id} model={m} />
      ))}
    </div>
  );
}

function ComparisonTab() {
  return (
    <Card>
      <SectionTitle
        icon={<Layers size={20} />}
        title="Comparison table"
        subtitle="All current models side by side"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-semibold text-gray-500 uppercase tracking-wide">
                Model
              </th>
              <th className="text-right py-2 pr-4 font-semibold text-gray-500 uppercase tracking-wide">
                Contexte
              </th>
              <th className="text-right py-2 pr-4 font-semibold text-gray-500 uppercase tracking-wide">
                Max output
              </th>
              <th className="text-right py-2 pr-4 font-semibold text-gray-500 uppercase tracking-wide">
                Input/MTok
              </th>
              <th className="text-right py-2 pr-4 font-semibold text-gray-500 uppercase tracking-wide">
                Output/MTok
              </th>
              <th className="text-center py-2 pr-4 font-semibold text-gray-500 uppercase tracking-wide">
                Adaptive
              </th>
              <th className="text-center py-2 font-semibold text-gray-500 uppercase tracking-wide">
                Extended
              </th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <TierBadge tier={m.tier} />
                    <span className="font-medium text-gray-800">{m.name}</span>
                  </div>
                  <code className="text-[10px] text-gray-400">{m.id}</code>
                </td>
                <td className="py-2.5 pr-4 text-right text-gray-700">
                  {m.contextWindow}
                </td>
                <td className="py-2.5 pr-4 text-right text-gray-700">
                  {m.maxOutput}
                </td>
                <td className="py-2.5 pr-4 text-right font-medium text-gray-800">
                  {m.inputPrice}
                </td>
                <td className="py-2.5 pr-4 text-right font-medium text-gray-800">
                  {m.outputPrice}
                </td>
                <td className="py-2.5 pr-4 text-center">
                  {m.adaptiveThinking ? (
                    <CheckCircle size={13} className="text-green-500 mx-auto" />
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2.5 text-center">
                  {m.extendedThinking ? (
                    <CheckCircle size={13} className="text-green-500 mx-auto" />
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function RagUsageTab() {
  return (
    <Card>
      <SectionTitle
        icon={<Zap size={20} />}
        title="Recommendation for this RAG project"
        subtitle="Which model to choose based on the use case"
      />
      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">
              Production —{" "}
              <code className="text-blue-700">claude-sonnet-4-6</code>
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Best balance for a RAG pipeline: 1M token context, 64k output,
              fast speed and reasonable cost ($3/$15).
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <CheckCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">
              Experimentation / high quality —{" "}
              <code className="text-blue-700">claude-opus-4-8</code> or{" "}
              <code className="text-blue-700">claude-fable-5</code>
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              For complex queries, synthesis over very long contexts, or
              response comparison.
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Zap size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">
              High volume / critical latency —{" "}
              <code className="text-blue-700">claude-haiku-4-5-20251001</code>
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Ideal for simple document Q&A with high throughput requirements.
              Context window limited to 200k tokens.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ConfigTab() {
  return (
    <Card>
      <SectionTitle
        icon={<Code2 size={20} />}
        title="Configuration"
        subtitle="Change the default model"
      />
      <p className="text-sm text-gray-700 mb-3">
        The default model is set by the environment variable{" "}
        <code className="bg-gray-100 px-1 rounded text-blue-700">
          LLM_MODEL
        </code>
        . It can be overridden per conversation via the <em>Parameters</em>{" "}
        panel in the chat interface.
      </p>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono leading-relaxed mb-4">
        {`# .env
LLM_MODEL=claude-sonnet-4-6       # recommended default
# LLM_MODEL=claude-opus-4-8       # high quality
# LLM_MODEL=claude-fable-5        # maximum capability
# LLM_MODEL=claude-haiku-4-5-20251001  # max speed`}
      </pre>
      <Callout type="info">
        The model chosen at the conversation level is stored with the
        conversation and visible in the Parameters panel (read-only) when
        reviewing an existing conversation.
      </Callout>
    </Card>
  );
}

export default function LLMModelsPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<Tab>(
    isTab(tabParam) ? tabParam : "Models",
  );

  useEffect(() => {
    if (isTab(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        icon={<Brain className="text-blue-600" size={28} />}
        title="LLM Models — Comparison"
        info="Overview of available Claude models, their characteristics, and when to use them in a RAG pipeline."
      />

      <TechnicalNav />
      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === "Models" && <ModelsTab />}
      {activeTab === "Comparison" && <ComparisonTab />}
      {activeTab === "RAG Usage" && <RagUsageTab />}
      {activeTab === "Config" && <ConfigTab />}
    </div>
  );
}
