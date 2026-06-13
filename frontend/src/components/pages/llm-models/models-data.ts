export type Tier = "flagship" | "performance" | "speed";

export interface ModelSpec {
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

export const MODELS: ModelSpec[] = [
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

export const TIER_COLORS: Record<Tier, string> = {
  flagship: "bg-amber-100 text-amber-800 border-amber-200",
  performance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  speed: "bg-green-100 text-green-800 border-green-200",
};

export const TIER_LABELS: Record<Tier, string> = {
  flagship: "Flagship",
  performance: "Performance",
  speed: "Speed",
};
