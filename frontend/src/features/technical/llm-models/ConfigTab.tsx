import { Code2 } from "lucide-react";
import Card from "../../../components/ui/Card";
import SectionTitle from "../../../components/ui/SectionTitle";
import Callout from "../../../components/ui/Callout";

export default function ConfigTab() {
  return (
    <Card>
      <SectionTitle
        icon={<Code2 size={20} />}
        title="Configuration"
        subtitle="Change the default model"
        accentColor="blue"
      />
      <p className="text-sm text-slate-700 mb-3">
        The default model is set by the environment variable{" "}
        <code className="bg-slate-100 px-1 rounded text-amber-700">
          LLM_MODEL
        </code>
        . It can be overridden per conversation via the <em>Parameters</em>{" "}
        panel in the chat interface.
      </p>
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs font-mono leading-relaxed mb-4">
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
