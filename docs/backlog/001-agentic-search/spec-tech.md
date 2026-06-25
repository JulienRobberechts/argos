# Technical Spec: Agentic Search — Option A (Direct Tool Use)

## Existing baseline

`ILLMPort` (`infra-ports/ai/ILLMPort.ts`) exposes a single method:

```ts
stream(prompt: string, onToken: (token: string) => void, signal?, options?): Promise<string>
```

`AnthropicLLMAdapter` implements it via `client.messages.stream()` — one API call, one text response, no tools.

`AskQuestion` follows the fixed pipeline: retrieve → build prompt → `llmAdapter.stream()` → one response.

---

## What Option A adds

A new `IAgentPort` is created alongside `ILLMPort` — the contract is fundamentally different:

| | `ILLMPort` | `IAgentPort` |
|---|---|---|
| Input | A prompt string | Messages + tool definitions |
| Output | Streamed text | Final text + tool call history |
| API calls | 1 | N (one per turn) |
| Loop | No | Yes — owned by AgenticSearch (app layer) |

### New port: `infra-ports/ai/IAgentPort.ts`

```ts
export interface AgentTool {
  name: string;
  description: string;
  input_schema: object; // JSON Schema
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string | AgentToolCall[] | AgentToolResult[];
}

export interface AgentToolCall {
  type: "tool_call";
  id: string;
  name: string;
  input: unknown;
}

export interface AgentToolResult {
  type: "tool_result";
  toolCallId: string;
  content: string;
}

export type AgentTurnResult =
  | { type: "tool_calls"; calls: AgentToolCall[]; inputTokens: number; outputTokens: number }
  | { type: "final"; text: string; inputTokens: number; outputTokens: number };

export interface IAgentPort {
  /** Execute one LLM turn and return either tool calls or a final text response. */
  callOnce(
    systemPrompt: string,
    messages: AgentMessage[],
    tools: AgentTool[],
    options?: { model?: string }
  ): Promise<AgentTurnResult>;
}
```

---

## Agent loop in `AgenticSearch` (app layer)

The loop is generic orchestration — it lives in the app, not the infra adapter. `ILLMPort` and `AnthropicLLMAdapter` are not modified.

```ts
// Pseudo-code (AgenticSearch)
const messages: AgentMessage[] = [{ role: "user", content: userMessage }];
let iterations = 0;
let totalInputTokens = 0;
let totalOutputTokens = 0;

while (iterations < maxIterations) {
  const turn = await this.agentPort.callOnce(systemPrompt, messages, tools);

  totalInputTokens += turn.inputTokens;
  totalOutputTokens += turn.outputTokens;

  if (turn.type === "final") {
    return { finalText: turn.text, toolCallsCount: iterations, totalInputTokens, totalOutputTokens };
  }

  // execute tools (IRetrieveKnowledge, IDocumentRepository)
  const results = await Promise.all(turn.calls.map(call => this.executeTool(call)));

  messages.push({ role: "assistant", content: turn.calls });
  messages.push({ role: "user", content: results });

  iterations++;
}
// guard: max iterations reached
```

## `AnthropicAgentAdapter` — single turn only

The adapter translates one `callOnce` call into one Anthropic API call and maps the response to `AgentTurnResult`. No loop, no callbacks.

```ts
// Pseudo-code (AnthropicAgentAdapter)
const response = await this.client.messages.create({
  model, max_tokens, system: systemPrompt,
  tools: tools.map(toAnthropicTool),
  messages: messages.map(toAnthropicMessage),
});

if (response.stop_reason === "end_turn") {
  return { type: "final", text: extractText(response), inputTokens: ..., outputTokens: ... };
}

if (response.stop_reason === "tool_use") {
  return {
    type: "tool_calls",
    calls: response.content.filter(b => b.type === "tool_use").map(toAgentToolCall),
    inputTokens: ...,
    outputTokens: ...,
  };
}
```

The adapter has no knowledge of `IRetrieveKnowledge`, `IDocumentRepository`, or loop state.

---

## Layer responsibilities

```
AgenticSearch           → owns the loop, executes tools, accumulates message history
IAgentPort              → boundary: generic single-turn contract
AnthropicAgentAdapter   → translates callOnce ↔ Anthropic API (format only, no loop)
```

Adding a new LLM provider = one class, one method. No loop logic to duplicate. Swapping the adapter does not touch tool execution or loop logic.

---

## Files to create

```
infra-ports/ai/
  IAgentPort.ts                   ← new port (AgentTool, AgentMessage, AgentToolCall, AgentToolResult, AgentTurnResult, IAgentPort)

infra/ai/
  AnthropicAgentAdapter.ts        ← implements IAgentPort; single-turn API call + format translation

app-ports/rag/
  IAgenticSearch.ts               ← use-case port (same shape as IAskQuestion)

app/rag/
  AgenticSearch.ts                ← orchestrates the agent loop; defines and executes tools

api/rag/
  AgenticSearchController.ts      ← POST /conversations/:id/messages/agentic
```

---

## Tools available to the agent

Defined in `AgenticSearch.ts`, passed as `AgentTool[]` to `IAgentPort.callOnce` each iteration:

| Tool | Backed by |
|---|---|
| `search_knowledge_base(query, limit?)` | `IRetrieveKnowledge` |
| `get_document_metadata(documentId)` | `IDocumentRepository` |
| `search_by_document(query, documentId, limit?)` | `IRetrieveKnowledge` (scoped) |

---

## What stays unchanged

- `ILLMPort` and `AnthropicLLMAdapter` are untouched — existing RAG pipeline is intact.
- `IRetrieveKnowledge` and `IDocumentRepository` are reused as-is inside `AgenticSearch`.
- Model is configurable via `AGENT_LLM_MODEL` env var, following the same pattern as `LLM_MODEL`.
