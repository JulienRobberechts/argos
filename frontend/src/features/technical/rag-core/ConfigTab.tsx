import { Code2 } from "lucide-react";
import Card from "../../../components/ui/Card";
import ParamRow from "../../../components/ui/ParamRow";
import SectionTitle from "../../../components/ui/SectionTitle";

export default function ConfigTab() {
  return (
    <Card>
      <SectionTitle
        icon={<Code2 size={20} />}
        title="Configuration Parameters"
        subtitle="All the knobs and what they do"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Env var
              </th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Default
              </th>
              <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Effect
              </th>
            </tr>
          </thead>
          <tbody>
            <ParamRow
              name="CHUNKING_STRATEGY"
              value="recursive"
              description="Switch between 'recursive' (token window) and 'sentence' (sentence-aware grouping). Sentence strategy preserves meaning boundaries better for prose; recursive is more predictable for technical docs."
            />
            <ParamRow
              name="CHUNK_SIZE_TOKENS"
              value="512"
              description="Maximum number of tokens (words) per chunk. Smaller = more precise retrieval but less context per chunk. Larger = richer context but noisier similarity scores."
            />
            <ParamRow
              name="CHUNK_OVERLAP_TOKENS"
              value="128"
              description="How many tokens from the end of chunk N are repeated at the start of chunk N+1. Prevents ideas from being split across a boundary. Rule of thumb: ~20-25% of chunk size."
            />
            <ParamRow
              name="RETRIEVAL_LIMIT"
              value="8"
              description="Maximum number of chunks returned by vector search. More chunks = richer context for the LLM but longer prompts and higher cost."
            />
            <ParamRow
              name="RETRIEVAL_MIN_SCORE"
              value="0.75"
              description="Cosine similarity threshold (0–1). Chunks below this score are discarded even if they are within the top-K. Raise this to reduce noise; lower it if you get 'no information' responses too often."
            />
            <ParamRow
              name="LLM_MAX_TOKENS"
              value="1024"
              description="Maximum tokens in the LLM response. Increase for detailed answers; decrease to save cost."
            />
          </tbody>
        </table>
      </div>
    </Card>
  );
}
