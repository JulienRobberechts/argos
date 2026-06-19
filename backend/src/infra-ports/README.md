# infra-ports

Interfaces (hexagonal architecture) defining contracts between the domain/app layers and infrastructure. Naming convention: `I` prefix.

- `ILogger` — structured logging

## ai/

- `ILLMPort` — LLM call (streaming)
- `IRerankPort` — reranking of search results
- `ITextEncoder` — text embedding generation

## persistence/

- `IAppSettingsRepository` — persistence of runtime configuration
- `IChunkRepository` — persistence and search (vector/hybrid) of chunks
- `IConversationRepository` — persistence of conversations and messages
- `IDocumentRepository` — persistence of documents
- `IDocumentSummaryRepository` — persistence of document summaries

## storage/

- `IDocumentParserPort` — text extraction from document content (buffer)
- `IFileStoragePort` — file storage (upload/download/delete)

Each port is implemented by one or more adapters in `../../infra`.
