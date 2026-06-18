# Dépendances Applications → Ports

## Interface Argos (app-ports)

```mermaid
graph LR
  Argos --> admin
  Argos --> kb[knowledgeBase]
  Argos --> quiz
  Argos --> rag

  admin --> IAppSettingsService
  admin --> ICheckStorageConsistency
  admin --> IResetAll

  kb --> ICreateDocument
  kb --> IIngestDocument
  kb --> ISummarizeDocument

  quiz --> IGenerateQuiz

  rag --> IAskQuestion
  rag --> IConversationTitleGenerator
  rag --> IRetrieveKnowledge
  rag --> ISourceCitationResolver
```

## AppSettingsService

```mermaid
graph LR
  AppSettingsService --> IAppSettingsRepository
```

## AskQuestion

```mermaid
graph LR
  AskQuestion --> IRetrieveKnowledge
  AskQuestion --> ILLMPort
  AskQuestion --> IConversationRepository
```

## CheckStorageConsistency

```mermaid
graph LR
  CheckStorageConsistency --> IDocumentRepository
  CheckStorageConsistency --> IFileStoragePort
```

## ConversationTitleGenerator

```mermaid
graph LR
  ConversationTitleGenerator --> ILLMPort
```

## CreateDocument

```mermaid
graph LR
  CreateDocument --> IDocumentRepository
  CreateDocument --> IFileStoragePort
```

## GenerateQuiz

```mermaid
graph LR
  GenerateQuiz --> IChunkRepository
  GenerateQuiz --> ILLMPort
```

## IngestDocument

```mermaid
graph LR
  IngestDocument --> IChunkRepository
  IngestDocument --> IDocumentRepository
  IngestDocument --> IFileParserPort
  IngestDocument --> IFileStoragePort
  IngestDocument --> ITextEncoder
```

## ResetAll

```mermaid
graph LR
  ResetAll --> IChunkRepository
  ResetAll --> IConversationRepository
  ResetAll --> IDocumentRepository
  ResetAll --> IDocumentSummaryRepository
  ResetAll --> IFileStoragePort
```

## RetrieveKnowledge

```mermaid
graph LR
  RetrieveKnowledge --> IChunkRepository
  RetrieveKnowledge --> IRerankPort
  RetrieveKnowledge --> ITextEncoder
```

## SourceCitationResolver

```mermaid
graph LR
  SourceCitationResolver --> IDocumentRepository
```

## SummarizeDocument

```mermaid
graph LR
  SummarizeDocument --> IChunkRepository
  SummarizeDocument --> IDocumentRepository
  SummarizeDocument --> IDocumentSummaryRepository
  SummarizeDocument --> ILLMPort
```
