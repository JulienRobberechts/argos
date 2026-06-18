# Dépendances Applications → Ports

## AppSettingsService

```mermaid
graph LR
  AppSettingsService --> IAppSettingsRepository
```

## AskQuestion

```mermaid
graph LR
  AskQuestion --> IChunkRepository
  AskQuestion --> IConversationRepository
  AskQuestion --> ILLMPort
  AskQuestion --> IRetrieveKnowledge
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
  RetrieveKnowledge --> IRetrieveKnowledge
```

## SourceCitationResolver

```mermaid
graph LR
  SourceCitationResolver --> IChunkRepository
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
