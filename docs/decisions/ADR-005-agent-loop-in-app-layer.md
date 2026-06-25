# ADR-005 — Agent Loop Ownership: App Layer, Not Infra Adapter

**Date**: 2026-06-25  
**Status**: Accepted

## Context

The agentic search feature (backlog/001) requires an LLM tool-use loop: call the model, receive tool calls, execute them, feed results back, repeat until a final answer or iteration guard. The question is which layer owns this loop.

Initial design placed the full loop inside `AnthropicAgentAdapter` (infra), with `onToolCall` passed as a callback so the app could execute tools. This created an inversion: infra was calling back into the app, which violates the dependency direction of hexagonal architecture.

## Options Considered

**Option A — Loop in infra (`runAgentLoop` with callback):**  
`IAgentPort.runAgentLoop(systemPrompt, userMessage, tools, onToolCall)` — the adapter drives the entire loop and delegates tool execution via a callback.

- Keeps Anthropic message format fully contained in the adapter.
- Infra controls flow and calls back into the app — reversed dependency direction.
- Adding a new LLM provider requires re-implementing the loop.

**Option B — Loop in app, single-turn infra (`callOnce`):**  
`IAgentPort.callOnce(systemPrompt, messages, tools)` — the adapter executes one API call and returns a generic `AgentTurnResult`. `AgenticSearch` (app) owns the `while` loop, tool execution, and message history.

- Loop logic is generic orchestration — belongs in the app by definition.
- Infra adapter is minimal: one API call + format translation.
- New provider = one class, one method. No loop to duplicate.
- Message history is managed in generic `AgentMessage[]` types defined in `infra-ports`.

## Decision

**Option B.** The loop is not provider-specific; putting it in infra was a misassignment of responsibility. The app layer owns orchestration; infra adapters translate.

`IAgentPort` exposes `callOnce` only. `AgenticSearch` accumulates `AgentMessage[]`, calls `callOnce` each iteration, executes tools via `IRetrieveKnowledge` and `IDocumentRepository`, and enforces the `MAX_ITERATIONS` guard.

## Consequences

- `AnthropicAgentAdapter` is a thin translation layer (~30–40 lines): maps `AgentMessage[]` → `MessageParam[]`, calls `client.messages.create()`, maps response → `AgentTurnResult`.
- `AgenticSearch` is testable with a fake `IAgentPort` that returns scripted sequences of `tool_calls` / `final` turns — no Anthropic SDK needed in app tests.
- Adding OpenAI, Gemini, or any other provider requires implementing only `callOnce` — no loop logic to copy.
- `AgentMessage` / `AgentToolCall` / `AgentToolResult` types in `infra-ports` must stay provider-agnostic.
