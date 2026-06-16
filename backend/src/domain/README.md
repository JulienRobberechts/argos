# domain

Cœur métier, sans dépendance framework/infra.

- `entities/` — `Document`, `Chunk`, `Conversation`, `Message`, `DocumentSummary`
- `ports/` — interfaces (repositories, `ILLMPort`, `IEmbeddingPort`, `IRerankPort`, `IFileStoragePort`, `IFileParserPort`) implémentées dans `../infrastructure`
- `services/` — logique de chunking (`ChunkingStrategy`, `RecursiveChunkingStrategy`, `SentenceChunkingStrategy`), voir `ChunkingStrategy.md`

Aucune dépendance vers `api`, `application` ou `infrastructure`.
