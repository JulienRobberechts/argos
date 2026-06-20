import { Code2, Info } from "lucide-react";
import Callout from "../../../components/ui/Callout";
import Card from "../../../components/ui/Card";
import CodeBlock from "../../../components/ui/CodeBlock";
import SectionTitle from "../../../components/ui/SectionTitle";

export default function ImplementationTab() {
  return (
    <>
      <Card className="mb-6">
        <SectionTitle
          icon={<Code2 size={20} />}
          title="Implementation — CheckResponseGrounding"
          subtitle="How the three strategies are orchestrated"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          The{" "}
          <code className="bg-slate-100 px-1 rounded text-amber-700">CheckResponseGrounding</code>{" "}
          use case runs after the LLM has generated its answer. It loops over the requested
          strategies and accumulates results. A failed strategy returns{" "}
          <code className="bg-slate-100 px-1 rounded">score = -1</code> with a warning rather than
          crashing the request.
        </p>
        <CodeBlock
          code={`// application/CheckResponseGrounding.ts (simplified)

async run(
  query: string,
  answer: string,
  chunks: ChunkSearchResult[],
  strategies: ResponseGroundingStrategy[],
): Promise<ResponseGroundingResult[]> {
  const results: ResponseGroundingResult[] = [];

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
            <code>ResponseGroundingStrategy</code> is a discriminated union:{" "}
            <code className="ml-1">"faithfulness" | "counterfactual" | "citation_forcing"</code>.
            The results are stored in the <code className="ml-1">messages.response_grounding</code>{" "}
            JSONB column and exposed via the conversations API.
          </Callout>
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon={<Info size={20} />}
          title="Domain types"
          subtitle="The shared data structures used across the stack"
        />
        <CodeBlock
          code={`// domain/entities/Message.ts

export type ResponseGroundingStrategy =
  | "faithfulness"
  | "counterfactual"
  | "citation_forcing";

export interface KnowledgeClaim {
  claim: string;
  status: "SUPPORTED" | "UNSUPPORTED";
  sourceExcerpt?: string;   // only present for citation_forcing
}

export interface ResponseGroundingResult {
  strategy: ResponseGroundingStrategy;
  score: number;           // 0–1, or -1 if the check failed
  claims: KnowledgeClaim[];
  warning?: string;        // shown in the UI when score < 1
}

export interface Message {
  ...
  responseGrounding?: ResponseGroundingResult[];  // one entry per strategy
}`}
        />
      </Card>
    </>
  );
}
