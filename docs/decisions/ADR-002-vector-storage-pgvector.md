# ADR-002 — Vector Storage: pgvector in PostgreSQL

**Date**: 2026-06-19  
**Status**: Accepted

## Context

Storing and querying embeddings requires either a dedicated vector database or an extension on an existing relational database. The project already uses PostgreSQL for all other persistence (documents, conversations, settings).

## Options Considered

- **Dedicated vector DB (Pinecone, Weaviate, Qdrant)** — purpose-built for ANN search, managed index tuning. Adds a second database to operate and increases infra complexity.
- **pgvector on PostgreSQL** — adds a `vector(N)` column type and HNSW/IVFFlat indexes to an existing Postgres instance. One database to manage, transactional consistency across embeddings and metadata, no extra service.
- **SQLite + sqlite-vss** — simpler for local dev, not viable for production workloads.

## Decision

Use **pgvector** on the existing PostgreSQL instance. Embeddings are stored in a `vector(1024)` column alongside document metadata. Cosine distance search uses the `<=>` operator.

At the project scale (internal knowledge base, hundreds to low thousands of documents), pgvector performance is sufficient. The reduction in operational complexity outweighs the ANN performance advantage of a dedicated vector DB.

## Consequences

- Single database to manage in both dev (Docker Compose) and prod (Railway).
- Hybrid search (vector + full-text) is possible in a single SQL query, enabling RRF ranking without cross-service joins (see `PgVectorChunkRepository.ts`).
- Scaling to millions of vectors would require revisiting this decision (HNSW index tuning or migration to a dedicated store).
- The `IChunkRepository` port isolates this choice — a Qdrant adapter could replace it without touching application logic.
