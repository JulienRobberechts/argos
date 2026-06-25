# Pitch: Agentic Search

## Background

Argos currently answers questions through a **fixed RAG pipeline**:

```
User query
  → embed (Voyage AI)
  → hybrid search (vector + FTS + RRF)
  → rerank (Voyage rerank-2.5)
  → top-N chunks injected into prompt
  → LLM streams answer (Claude Haiku)
```

This pipeline is predictable and cheap. But it is also **rigid**: every question follows the same path regardless of complexity, and there is no recovery if the first retrieval step misses.

---

## Problem

The fixed pipeline fails or underperforms in several scenarios:

| Scenario | Why it fails |
|---|---|
| Multi-hop questions ("Who wrote X, and what else did they author?") | Single retrieval step can't chain facts |
| Ambiguous queries | No query reformulation or disambiguation step |
| Low-recall first pass | If relevant chunks score below `minScore`, there's no retry |
| Questions requiring broad context | Fixed `retrievalLimit` caps the evidence gathered |

---

## Proposed Solution: Agentic Search

Instead of a fixed pipeline, give an LLM **tools** and let it decide which to call, in what order, and how many times — until it has enough evidence to answer.

**Tools available to the agent:**

| Tool | Description |
|---|---|
| `search_knowledge_base(query, limit?)` | Hybrid search + rerank via existing `IRetrieveKnowledge` |
| `get_document_metadata(documentId)` | Fetch title, source, and summary of a specific document |
| `search_by_document(query, documentId, limit?)` | Scoped search within a single document |

The agent loop runs until the model emits a final text response or a maximum iteration guard is hit (default: 6 turns).

**Goal:** not to replace the RAG pipeline, but to **run both in parallel** on the same questions and compare quality, cost, and latency.

---

## Models

The agent makes multiple LLM calls per question (one per tool-use turn), so model choice directly affects cost and latency.

| Model | Use case | Rationale |
|---|---|---|
| `claude-sonnet-4-6` | **Default agent model** | Best cost/capability balance for multi-step tool use |
| `claude-opus-4-8` | Complex or high-stakes queries | Strongest reasoning; use when answer quality is the priority |
| `claude-haiku-4-5-20251001` | Fast/cheap comparisons | Already the RAG default; exposes the gap between pipeline and agent |

Model is configurable via an env variable (e.g. `AGENT_LLM_MODEL`), following the same pattern as `LLM_MODEL` for the RAG pipeline.

### Standard models vs. reasoning models

For the use cases targeted here — multi-hop retrieval, query reformulation, document synthesis — **standard models (Sonnet, Haiku) are sufficient**. The bottleneck in a RAG system is retrieval quality, not generation quality: giving a standard model better-retrieved chunks consistently outperforms giving a reasoning model poorly-retrieved ones.

Reasoning models (OpenAI o1/o3, DeepSeek-R1) add measurable value only when the query requires **multi-document logical inference or calculation** — e.g., comparing figures across reports, verifying cross-document consistency. For Argos's current document corpus (technical knowledge base), this is the exception rather than the rule.

If the comparison experiment surfaces cases where Sonnet struggles analytically, a reasoning model variant can be added as a fourth option without any architectural change — `AGENT_LLM_MODEL` already supports it.

---

## Technology: Direct Tool Use via Anthropic SDK

Two options were considered:

**Option A — Direct tool use (`@anthropic-ai/sdk`):** Define tools as `Tool[]` in the API call. The app layer handles the tool-call/result loop. No new dependencies. Already the pattern used by `ILLMPort`.

**Option B — MCP (Model Context Protocol):** Expose the knowledge base as an MCP server. Enables reuse from Claude Desktop or other MCP clients. More operational complexity (separate server process, transport layer).

**Decision: start with Option A.** The Anthropic SDK is already integrated, tool definitions map directly to existing ports, and MCP can be layered on later if cross-client reuse becomes a requirement.

---

## Agent Loop Responsibility

The `IAgentPort` contract exposes a **single-turn** method (`callOnce`) rather than a full loop. The agent orchestration loop lives in the app layer (`AgenticSearch`), not the infra adapter.

**Rationale:** The loop is generic orchestration logic — not provider-specific. Keeping it in the app layer means infra adapters only translate one API call + its response format. Adding support for a new LLM provider requires minimal code: one class implementing `IAgentPort` with a single method. See ADR-005.

---

## Architecture

The agentic search follows the same hexagonal structure as the existing RAG use case.

```
api/rag/
  AgenticSearchController.ts      ← new REST endpoint (POST /conversations/:id/messages/agentic)

app/rag/
  AgenticSearch.ts                ← new use case; owns the agent loop; executes tools

app-ports/rag/
  IAgenticSearch.ts               ← port interface (same shape as IAskQuestion)

infra/ai/
  AnthropicAgentAdapter.ts        ← implements IAgentPort; single-turn API call only

infra-ports/ai/
  IAgentPort.ts                   ← callOnce(messages, tools, options) → AgentTurnResult
```

**Tool execution and loop control stay in the app layer** (`AgenticSearch.ts`). The infra adapter handles one API call + format translation only; it has no knowledge of the domain or loop logic.

**Agent loop (inside `AgenticSearch`, app layer):**

```
1. Call IAgentPort.callOnce(messages, tools)
2. Response has tool calls?
   YES → execute each tool (via IRetrieveKnowledge / IDocumentRepository)
       → append assistant + tool_result messages → go to 1
   NO  → return final text
3. Guard: if iteration count > MAX_ITERATIONS → return partial answer with warning
```

---

## Comparison Framework

Both modes should be evaluated on the **same question set** (reuse or extend `tests/retrieval/`).

Metrics per question:

| Metric | RAG | Agentic |
|---|---|---|
| Answer faithfulness | grounding check | grounding check |
| Hallucination rate | % unsupported claims | % unsupported claims |
| Retrieval coverage | chunks found | chunks found (all turns) |
| Latency | ms | ms |
| Input tokens | prompt tokens | Σ tokens across turns |
| Tool calls | — | count |

A lightweight comparison script (`tests/retrieval/agentic-vs-rag.retrieval.test.ts`) will run both paths against the same cases and log a side-by-side table.

**Evaluation standard:** Use [RAGAS](https://docs.ragas.io) as the reference framework for faithfulness and context relevance scoring — it is the industry standard for RAG evaluation and measures both whether the answer is grounded in retrieved chunks (faithfulness) and whether the retrieved chunks were relevant to the query (context precision/recall). The comparison script should output RAGAS-compatible metrics to allow later integration with a scoring pipeline.

---

## Out of Scope

- Replacing the existing RAG pipeline.
- Persisting agent "thoughts" or intermediate steps in the conversation history.
- MCP server setup (deferred).
- Streaming partial tool-call progress to the UI (deferred — final answer streams as today).
