# ADR-003 — Retrieval Pipeline: Hybrid Search + Reranking

**Date**: 2026-06-19  
**Status**: Accepted

## Context

This project is a **RAG lab** — its primary purpose is to explore and implement as many RAG techniques as possible, not to ship the simplest production solution. Implementing advanced retrieval patterns is a goal in itself, independent of whether the current document corpus strictly requires it.

## Options Considered

- **Vector search only** — the minimal baseline. Sufficient for many corpora, but leaves hybrid and reranking techniques unexplored.
- **Keyword search only (BM25/FTS)** — reliable for exact terms, misses paraphrases.
- **Hybrid search (vector + FTS + RRF)** — combines both approaches via Reciprocal Rank Fusion. A well-studied pattern worth implementing.
- **Hybrid + reranking** — adds a second-pass reranker on the merged candidate pool. Represents the current state-of-the-art retrieval pipeline.

## Decision

Implement the **full pipeline**: hybrid search (vector + PostgreSQL FTS merged via RRF) as default (`SEARCH_MODE=hybrid`), followed by **Voyage AI reranking** (`RERANK_ENABLED=true`, `rerank-2.5`), because exploring these techniques is the point of the project.

The retrieval flow:
1. Embed the query (Voyage AI, `"query"` type).
2. Run vector search and FTS in parallel in a single SQL query.
3. Merge results with RRF (`k=60`).
4. Rerank top `limit × RERANK_CANDIDATE_MULTIPLIER` candidates with Voyage Rerank.
5. Return top `RETRIEVAL_LIMIT` (default: 8) chunks above `RETRIEVAL_MIN_SCORE` (default: 0.75).

All parameters are tunable via environment variables without code changes.

## Consequences

- Each query costs one embedding call + one reranking call (in addition to the SQL query).
- Search mode and reranking can be disabled via config for cost/latency trade-offs.
- The `IChunkRepository` interface abstracts the hybrid SQL logic; the reranking step lives in `RetrieveKnowledge` application service behind `IRerankPort`.
- A `NoopRerankAdapter` is available for local dev to avoid consuming Voyage API credits.
