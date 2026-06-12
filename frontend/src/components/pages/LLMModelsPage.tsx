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
  const labels = { info: "Note", tip: "Conseil", warning: "Important" };
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
  speed: "Vitesse",
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
    latency: "Modérée",
    knowledgeCutoff: "—",
    adaptiveThinking: true,
    extendedThinking: false,
    bestFor: [
      "Tâches de raisonnement les plus complexes",
      "Travail agentique longue durée",
      "Cas nécessitant la meilleure intelligence disponible",
    ],
    limitations: [
      "Coût le plus élevé ($10/$50 par MTok)",
      "Latence plus élevée que Sonnet/Haiku",
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
    latency: "Modérée",
    knowledgeCutoff: "Jan 2026",
    adaptiveThinking: true,
    extendedThinking: false,
    bestFor: [
      "Raisonnement complexe et multi-étapes",
      "Codage agentique longue durée",
      "Analyse approfondie de documents longs",
    ],
    limitations: [
      "Coût élevé ($5/$25 par MTok)",
      "Latence plus élevée que Sonnet/Haiku",
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
    latency: "Rapide",
    knowledgeCutoff: "Août 2025",
    adaptiveThinking: true,
    extendedThinking: true,
    bestFor: [
      "Meilleur rapport intelligence/vitesse/coût",
      "Applications de production RAG",
      "Génération de réponses structurées",
    ],
    limitations: ["Max output inférieur à Opus (64k vs 128k)"],
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    tier: "speed",
    contextWindow: "200k tokens",
    maxOutput: "64k tokens",
    inputPrice: "$1",
    outputPrice: "$5",
    latency: "Le plus rapide",
    knowledgeCutoff: "Fév 2025",
    adaptiveThinking: false,
    extendedThinking: true,
    bestFor: [
      "Réponses à faible latence",
      "Volume élevé / coût réduit",
      "Tâches simples de Q&A sur documents",
    ],
    limitations: [
      "Fenêtre contextuelle plus petite (200k)",
      "Pas d'adaptive thinking",
      "Cutoff de connaissance plus ancien",
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
            Contexte:{" "}
            <strong className="text-gray-800">{model.contextWindow}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <ArrowRight size={12} className="text-gray-400 shrink-0" />
          <span>
            Sortie max:{" "}
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
            Latence: <strong className="text-gray-800">{model.latency}</strong>
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
            Idéal pour
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
            Limites
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

export default function LLMModelsPage() {
  return (
    <div className="p-8 max-w-5xl">
      <TechnicalNav />

      <PageHeader
        icon={<Brain className="text-blue-600" size={28} />}
        title="Modèles LLM — Comparaison"
        info="Vue d'ensemble des modèles Claude disponibles, leurs caractéristiques et quand les utiliser dans un pipeline RAG."
      />

      {/* ── CARDS ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {MODELS.map((m) => (
          <ModelCard key={m.id} model={m} />
        ))}
      </div>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<Layers size={20} />}
          title="Tableau comparatif"
          subtitle="Tous les modèles courants côte à côte"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-semibold text-gray-500 uppercase tracking-wide">
                  Modèle
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
                <tr
                  key={m.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <TierBadge tier={m.tier} />
                      <span className="font-medium text-gray-800">
                        {m.name}
                      </span>
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
                      <CheckCircle
                        size={13}
                        className="text-green-500 mx-auto"
                      />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    {m.extendedThinking ? (
                      <CheckCircle
                        size={13}
                        className="text-green-500 mx-auto"
                      />
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

      {/* ── RAG RECOMMENDATION ───────────────────────────────────────────────── */}
      <Card className="mb-6">
        <SectionTitle
          icon={<Zap size={20} />}
          title="Recommandation pour ce projet RAG"
          subtitle="Quel modèle choisir selon le cas d'usage"
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
                Meilleur équilibre pour un pipeline RAG : contexte 1M tokens,
                sortie 64k, vitesse rapide et coût raisonnable ($3/$15).
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">
                Expérimentation / haute qualité —{" "}
                <code className="text-blue-700">claude-opus-4-8</code> ou{" "}
                <code className="text-blue-700">claude-fable-5</code>
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Pour les requêtes complexes, la synthèse sur de très longs
                contextes ou la comparaison des réponses.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Zap size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">
                Volume élevé / latence critique —{" "}
                <code className="text-blue-700">claude-haiku-4-5-20251001</code>
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Idéal pour les Q&A simples sur documents avec fort débit requis.
                Fenêtre contextuelle limitée à 200k tokens.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── CONFIG ───────────────────────────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon={<Code2 size={20} />}
          title="Configuration"
          subtitle="Changer le modèle par défaut"
        />
        <p className="text-sm text-gray-700 mb-3">
          Le modèle par défaut est défini par la variable d'environnement{" "}
          <code className="bg-gray-100 px-1 rounded text-blue-700">
            LLM_MODEL
          </code>
          . Il peut être surchargé par conversation via le panneau{" "}
          <em>Parameters</em> dans l'interface de chat.
        </p>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono leading-relaxed mb-4">
          {`# .env
LLM_MODEL=claude-sonnet-4-6       # défaut recommandé
# LLM_MODEL=claude-opus-4-8       # haute qualité
# LLM_MODEL=claude-fable-5        # capacité maximale
# LLM_MODEL=claude-haiku-4-5-20251001  # vitesse max`}
        </pre>
        <Callout type="info">
          Le modèle choisi au niveau conversation est stocké avec la
          conversation et visible dans le panneau Parameters (read-only) lors de
          la relecture d'une conversation existante.
        </Callout>
      </Card>
    </div>
  );
}
