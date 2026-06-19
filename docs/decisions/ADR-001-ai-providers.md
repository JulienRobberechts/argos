# ADR-001 — AI Providers: Anthropic (LLM) + Voyage AI (Embeddings & Reranking)

**Date**: 2026-06-19  
**Status**: Accepted

## Context

The RAG pipeline requires three AI capabilities: text generation (LLM), embedding (for vector search), and reranking (to improve retrieval precision). These can be provided by the same vendor or split across specialized providers.

## Options Considered

- **All-in-one (OpenAI)** — GPT-4 for LLM, `text-embedding-3` for embeddings. Simple setup, one API key. But OpenAI embeddings lag behind specialized providers on retrieval benchmarks.
- **Anthropic + Voyage AI** — Claude for LLM, Voyage for embeddings and reranking. Two API keys, but Voyage AI is a dedicated retrieval provider with best-in-class embedding and reranking models (`voyage-4-lite`, `rerank-2.5`).
- **Anthropic + Cohere** — Similar split, but Voyage has better benchmark results for the relevant use case (multilingual technical docs).

## Decision

Use **Anthropic Claude** (`claude-haiku-4-5-20251001` by default, overridable via `LLM_MODEL`) for generation, and **Voyage AI** for both embeddings (`voyage-4-lite`) and reranking (`rerank-2.5`).

Voyage AI was chosen for embeddings because it distinguishes `"query"` vs `"document"` input types, which improves asymmetric retrieval quality. Both models are overridable via environment variables.

## Consequences

- Two external API dependencies (`ANTHROPIC_APP_API_KEY`, `VOYAGE_API_KEY`).
- The `ITextEncoder` and `IRerankPort` interfaces isolate the Voyage dependency — swapping providers requires only a new adapter.
- The `ILLMPort` interface similarly isolates Anthropic.
- Model names are not hardcoded: they are configured via `LLM_MODEL`, `EMBEDDING_MODEL`, `RERANK_MODEL`.
