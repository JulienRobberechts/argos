import { Code2 } from "lucide-react";
import Callout from "../../../components/ui/Callout";
import Card from "../../../components/ui/Card";
import CodeBlock from "../../../components/ui/CodeBlock";
import SectionTitle from "../../../components/ui/SectionTitle";

export default function ConfigTab() {
  return (
    <Card>
      <SectionTitle
        icon={<Code2 size={20} />}
        title="Configuration"
        subtitle="Change the default model"
      />
      <p className="text-sm text-slate-700 mb-3">
        The default model is set by the environment variable{" "}
        <code className="bg-slate-100 px-1 rounded text-amber-700">
          LLM_MODEL
        </code>
        . It can be overridden per conversation via the <em>Parameters</em>{" "}
        panel in the chat interface.
      </p>
      <div className="mb-4">
        <CodeBlock
          code={`# .env
LLM_MODEL=claude-haiku-4-5-20251001  # project default (fast & cheap)
# LLM_MODEL=claude-sonnet-4-6        # higher quality / production upgrade
# LLM_MODEL=claude-opus-4-8          # complex reasoning
# LLM_MODEL=claude-fable-5           # maximum capability`}
        />
      </div>
      <Callout type="info">
        The model chosen at the conversation level is stored with the
        conversation and visible in the Parameters panel (read-only) when
        reviewing an existing conversation.
      </Callout>
    </Card>
  );
}
