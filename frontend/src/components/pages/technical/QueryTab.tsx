import { Search, Hash, Layers, MessageSquare } from "lucide-react";
import Card from "../../ui/Card";
import SectionTitle from "../../ui/SectionTitle";
import CodeBlock from "../../ui/CodeBlock";
import Callout from "../../ui/Callout";
import PipelineStep from "./PipelineStep";

export default function QueryTab() {
  return (
    <>
      <Card className="mb-6">
        <SectionTitle
          icon={<Search size={20} />}
          title="Phase 2 — Query Pipeline"
          subtitle="From user question to grounded answer"
        />
        <PipelineStep
          step={1}
          icon={<Hash size={16} />}
          title="Embed the question"
          description={`The user's question is sent to Voyage AI with input_type "query". This produces a 1024-float vector that represents the question's meaning.`}
        />
        <PipelineStep
          step={2}
          icon={<Search size={16} />}
          title="Retrieve top-K chunks"
          description="pgvector compares the question vector against all stored chunk vectors using cosine similarity. The top 8 chunks with a score ≥ 0.75 are returned."
        />
        <PipelineStep
          step={3}
          icon={<Layers size={16} />}
          title="Build the prompt"
          description="The retrieved chunks are formatted as numbered SOURCEs. The last 4 conversation exchanges (sliding window) are appended as history. Then the user question is added."
        />
        <PipelineStep
          step={4}
          icon={<MessageSquare size={16} />}
          title="Stream the LLM answer"
          description="The prompt is sent to Claude Haiku. The model is instructed to answer ONLY using the provided sources. The response streams back token-by-token via Server-Sent Events."
          isLast
        />

        <p className="text-sm font-medium text-slate-800 mt-2 mb-2">
          Prompt structure
        </p>
        <CodeBlock
          code={`You are a helpful assistant. Answer based only on the provided sources.

SOURCES:
SOURCE 1:
<chunk text from the database>

SOURCE 2:
<chunk text from the database>

... (up to 8 sources)

CONVERSATION:
User: <previous question>
Assistant: <previous answer>
... (last 4 exchanges)

User: <current question>`}
        />
        <div className="mt-4">
          <Callout type="warning">
            If no chunk scores above the minimum threshold, the system returns a
            fixed "I don't have enough information" message without ever calling
            the LLM. This prevents hallucinations on topics not in the knowledge
            base.
          </Callout>
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon={<MessageSquare size={20} />}
          title="The Language Model — Claude Haiku"
          subtitle="Generating the final answer"
        />
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          This project uses <strong>Claude Haiku 4.5</strong> (Anthropic) as its
          LLM. Haiku is fast and cost-efficient, well-suited for answering
          questions from a pre-filtered context.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Streaming (SSE)
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              The Anthropic SDK streams tokens back one by one. Each token is
              pushed immediately to the browser via{" "}
              <strong>Server-Sent Events</strong> (SSE), so the user sees the
              answer build up in real time without waiting for the full
              completion.
            </p>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Abort / cancellation
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              An <code className="bg-slate-100 px-1 rounded">AbortSignal</code>{" "}
              is passed all the way from the HTTP request to the Anthropic
              stream. If the user navigates away, the stream is cancelled
              immediately — no wasted tokens.
            </p>
          </div>
        </div>
        <p className="text-sm font-medium text-slate-800 mb-2">
          Auto-generated conversation title
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          After the first exchange in a conversation, the LLM is called a second
          time with a short meta-prompt asking it to summarise the exchange in 5
          words. This title is stored in the{" "}
          <code className="bg-slate-100 px-1 rounded text-amber-700">
            conversations
          </code>{" "}
          table and shown in the sidebar.
        </p>
      </Card>
    </>
  );
}
