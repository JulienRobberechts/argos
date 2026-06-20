import { AlertTriangle, CheckCircle, Eye } from "lucide-react";
import Callout from "../../../components/ui/Callout";
import Card from "../../../components/ui/Card";
import SectionTitle from "../../../components/ui/SectionTitle";

type FailureRow = {
  mode: string;
  what: string;
  invisible: string;
};

const FAILURE_MODES: FailureRow[] = [
  {
    mode: "Hallucination",
    what: "LLM generates facts not present in retrieved chunks",
    invisible: "Retrieval metrics",
  },
  {
    mode: "Poor retrieval",
    what: "Relevant chunks never reach the LLM",
    invisible: "Generation metrics",
  },
  {
    mode: "Answer drift",
    what: "Chunks retrieved, LLM reads them, but answers a different question",
    invisible: "Faithfulness alone",
  },
];

export default function OverviewTab() {
  return (
    <>
      <Card className="mb-6">
        <SectionTitle
          icon={<AlertTriangle size={20} />}
          title="RAG systems fail silently"
          subtitle="No errors, fast responses, plausible answers — while consistently producing wrong ones"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          A RAG pipeline can look perfectly healthy at the infrastructure level while silently
          failing at the semantic level. Unit tests and type safety cannot catch this class of
          failure — it lives in the <strong>quality of the output</strong>, not its structure.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          Three distinct failure modes exist. Each is invisible to the metrics that catch the others
          — which is why a single metric is never enough.
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Failure mode
                </th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  What happens
                </th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Not caught by
                </th>
              </tr>
            </thead>
            <tbody>
              {FAILURE_MODES.map((row) => (
                <tr key={row.mode} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-amber-800">{row.mode}</td>
                  <td className="py-2 pr-4 text-slate-600">{row.what}</td>
                  <td className="py-2 text-slate-500 text-xs">{row.invisible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">
            Concrete example from this project
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Query: <em className="text-amber-800">"Quand a commencé l'Orient-Express ?"</em>
          </p>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            The retrieved chunks score ~0.38 and contain only a bibliography reference. The LLM
            answers <em>"1883, Nagelmackers"</em> — correct, but sourced from training weights, not
            from the documents. The RAG pipeline failed with no visible signal. A faithfulness check
            immediately exposes this:{" "}
            <strong>both claims are unsupported by the retrieved context → score 0.0</strong>.
          </p>
        </div>
      </Card>

      <Card className="mb-6">
        <SectionTitle
          icon={<Eye size={20} />}
          title="Why Val-en-Selve is the ideal test corpus"
          subtitle="A fictional city with zero parametric knowledge"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          The proposed eval uses two corpora. One is a fully fictional city — Val-en-Selve, 42 500
          inhabitants, karstique valley, geothermal energy, tirage-au-sort adjoint. The LLM has
          never seen this city in training data.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          This makes it a <strong>perfect faithfulness stress test</strong>: any correct answer
          about Val-en-Selve <em>must</em> come from the retrieved chunks. A faithfulness failure
          here is unambiguous — the model invented the detail.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
              Orient-Express
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real historical content — LLM knows it from training. Tests whether retrieval is used{" "}
              <em>despite</em> parametric knowledge being available.
            </p>
          </div>
          <div className="border border-green-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
              Val-en-Selve
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fictional — zero parametric knowledge. Any correct answer proves retrieval worked. Any
              wrong or invented answer proves it failed.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon={<CheckCircle size={20} />}
          title="Offline evaluation vs online monitoring"
          subtitle="Two complementary approaches"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          Evaluation can happen at two levels. This project ships the building blocks for the second
          and a design for the first:
        </p>
        <div className="space-y-3">
          <div className="border border-slate-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-800 mb-1">
              Offline evaluation{" "}
              <span className="text-xs font-normal text-amber-500 ml-1">
                — proposed (see Implementation tab)
              </span>
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              A labeled dataset of known questions and reference answers, run as a batch job to
              produce precise, reproducible scores. Not yet implemented — today the closest thing is
              the integration retrieval test in <code>tests/retrieval/</code>.
            </p>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-800 mb-1">
              Online checks{" "}
              <span className="text-xs font-normal text-green-600 ml-1">— implemented, opt-in</span>
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              The grounding strategies (faithfulness, counterfactual, citation forcing) run per
              request via <code>CheckResponseGrounding</code> and are stored in{" "}
              <code>Message.responseGrounding</code>. They are <strong>off by default</strong> (
              <code>config.rag.responseGroundingStrategies</code> is empty) and enabled per
              conversation or via config. No labeled dataset needed.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Callout type="info">
            Offline eval would validate the pipeline against known questions; the online grounding
            checks catch regressions on live traffic. They are complementary — neither replaces the
            other.
          </Callout>
        </div>
      </Card>
    </>
  );
}
