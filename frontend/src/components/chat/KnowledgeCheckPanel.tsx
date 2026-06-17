import {
  ChevronDown,
  Equal,
  EqualNot,
  ExternalLink,
  Files,
  Globe,
  Info,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { KnowledgeCheckResult } from "../../types/domain";

const STRATEGY_LABEL: Record<string, string> = {
  faithfulness: "Faithfulness",
  counterfactual: "Counterfactual",
  citation_forcing: "Citation forcing",
};

const STRATEGY_DESCRIPTION: Record<string, string> = {
  faithfulness:
    "Verifies that every claim in the response is directly supported by the retrieved documents, detecting hallucinations.",
  counterfactual:
    "Detects whether the model relies on its training-data knowledge instead of the provided context, by re-asking the question without any documents and comparing the two answers.",
  citation_forcing:
    "Forces the model to cite a source for each claim and checks whether those citations genuinely support the claim.",
};

const STRATEGY_LINK: Record<string, string> = {
  faithfulness:
    "https://docs.ragas.io/en/latest/concepts/metrics/faithfulness/",
  counterfactual:
    "https://docs.ragas.io/en/latest/concepts/metrics/context_utilization/",
  citation_forcing:
    "https://docs.ragas.io/en/latest/concepts/metrics/answer_relevance/",
};

const STRATEGY_ORDER = ["faithfulness", "citation_forcing", "counterfactual"];

function ScoreBadge({ score }: { score: number }) {
  if (score < 0) return null;
  const pct = Math.round(score * 100);
  const color =
    score >= 0.8
      ? "bg-green-100 text-green-700"
      : score >= 0.5
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${color}`}>
      {pct}%
    </span>
  );
}

function ClaimsList({ result }: { result: KnowledgeCheckResult }) {
  if (result.claims.length === 0) return null;
  return (
    <ul className="space-y-1">
      {result.claims.map((claim, _i) => (
        <li key={claim.claim} className="flex gap-2 text-slate-600">
          <span
            className={`mt-1 shrink-0 w-1.5 h-1.5 rounded-full ${
              claim.status === "SUPPORTED" ? "bg-green-400" : "bg-red-400"
            }`}
          />
          <span className="flex flex-col gap-0.5">
            <span>
              {claim.claim}
              {claim.sourceExcerpt && (
                <span className="ml-1 text-slate-400 italic">
                  — "{claim.sourceExcerpt.slice(0, 80)}…"
                </span>
              )}
            </span>
            {claim.documentId && claim.documentTitle && (
              <Link
                to={`/documents/${claim.documentId}`}
                className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-700 underline underline-offset-2"
              >
                <ExternalLink size={9} />
                {claim.documentTitle}
              </Link>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CounterfactualDetail({ result }: { result: KnowledgeCheckResult }) {
  return (
    <div className="space-y-2">
      {result.similar !== undefined && (
        <div className="flex items-center gap-1.5">
          {result.similar ? (
            <>
              <Globe size={12} className="text-amber-500 shrink-0" />
              <span className="text-amber-700">
                Answer relies on public knowledge
              </span>
            </>
          ) : (
            <>
              <Files size={12} className="text-green-500 shrink-0" />
              <span className="text-green-700">
                Answer is grounded in the provided documents
              </span>
            </>
          )}
        </div>
      )}
      {result.trainingAnswer && (
        <div className="bg-slate-50 rounded px-2 py-1.5 text-slate-600">
          <div className="flex items-center gap-1.5">
            {result.similar ? (
              <Equal size={11} className="text-amber-500 shrink-0" />
            ) : (
              <EqualNot size={11} className="text-green-500 shrink-0" />
            )}
            <span className="font-medium text-slate-500 text-[10px] uppercase tracking-wide">
              Training-only answer
            </span>
          </div>
          <p className="mt-0.5">{result.trainingAnswer}</p>
        </div>
      )}
      {result.claims.length > 0 && (
        <div className="flex gap-1.5 items-start text-slate-600">
          <span
            className={`mt-1 shrink-0 w-1.5 h-1.5 rounded-full ${
              result.claims[0].status === "SUPPORTED"
                ? "bg-green-400"
                : "bg-red-400"
            }`}
          />
          <span>{result.claims[0].claim}</span>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeCheckPanel({
  results,
}: {
  results: KnowledgeCheckResult[];
}) {
  const [open, setOpen] = useState(false);
  const sorted = [...results].sort(
    (a, b) =>
      STRATEGY_ORDER.indexOf(a.strategy) - STRATEGY_ORDER.indexOf(b.strategy),
  );
  const anyWarning = sorted.some((r) => r.warning);
  const counterfactual = sorted.find((r) => r.strategy === "counterfactual");

  return (
    <div className="mt-2 border border-slate-100 rounded-lg text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left rounded-t-lg"
      >
        {anyWarning ? (
          <ShieldAlert size={13} className="text-amber-500 shrink-0" />
        ) : (
          <ShieldCheck size={13} className="text-green-500 shrink-0" />
        )}
        <span className="font-medium text-slate-600 flex-1 flex items-center gap-1.5">
          Knowledge check
          {counterfactual?.similar !== undefined &&
            (counterfactual.similar ? (
              <Globe size={12} className="text-amber-500" />
            ) : (
              <Files size={12} className="text-green-500" />
            ))}
        </span>
        <div className="flex gap-1.5 items-center">
          {sorted.map((r) =>
            r.strategy !== "counterfactual" ? (
              <ScoreBadge key={r.strategy} score={r.score} />
            ) : null,
          )}
        </div>
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="divide-y divide-slate-50">
          {sorted.map((result) => (
            <div key={result.strategy} className="px-3 py-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                  {STRATEGY_LABEL[result.strategy] ?? result.strategy}
                </span>
                {STRATEGY_DESCRIPTION[result.strategy] && (
                  <div className="relative group inline-flex items-center">
                    <Info size={11} className="text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-slate-200 rounded-lg shadow-md text-[10px] p-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 leading-relaxed">
                      <p className="text-slate-600">
                        {STRATEGY_DESCRIPTION[result.strategy]}
                      </p>
                      <a
                        href={STRATEGY_LINK[result.strategy]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-amber-500 hover:text-amber-700 font-medium"
                      >
                        Learn more about{" "}
                        {STRATEGY_LABEL[result.strategy] ?? result.strategy}
                        <ExternalLink size={8} />
                      </a>
                    </div>
                  </div>
                )}
                {result.strategy !== "counterfactual" && (
                  <ScoreBadge score={result.score} />
                )}
              </div>
              {result.warning && (
                <p className="text-amber-600 bg-amber-50 rounded px-2 py-1">
                  {result.warning}
                </p>
              )}
              {result.strategy === "counterfactual" ? (
                <CounterfactualDetail result={result} />
              ) : (
                <ClaimsList result={result} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
