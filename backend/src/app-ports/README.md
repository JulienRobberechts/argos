# app-ports

Application port interfaces (hexagonal architecture) — contracts exposed by the `app` layer and consumed by `api`.

## admin/

- `IAppSettingsService` — read/update runtime configuration
- `ICheckStorageConsistency` — detect storage/DB inconsistencies
- `IResetAll` — reset all data and settings

## knowledgeBase/

- `ICreateDocument` — upload a file and register a document
- `IIngestDocument` — parse, chunk, and embed a document
- `ISummarizeDocument` — generate and persist a document summary

## quiz/

- `IGenerateQuiz` — generate multiple-choice questions from a document

## rag/

- `IAskQuestion` — answer a user question via RAG
- `IRetrieveKnowledge` — retrieve relevant chunks for a query
- `ISourceCitationResolver` — resolve chunk references into document sources
- `IConversationTitleGenerator` — generate a title for a conversation
