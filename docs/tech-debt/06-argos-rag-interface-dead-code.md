# [TECH DEBT] ArgosRag interface is unused (dead code)

**Affected layer:** `app-ports/rag/index.ts` (lines 15–20)

## Problem

The `ArgosRag` interface is defined but never referenced:

```typescript
export interface ArgosRag {
  askQuestion: IAskQuestion;
  conversationTitleGenerator: IConversationTitleGenerator;
  retrieveKnowledge: IRetrieveKnowledge;
  sourceCitationResolver: ISourceCitationResolver;
}
```

`registry.ts` and `api/app.ts` wire each use case individually without going through this grouping.
`ICheckResponseGrounding` (added when fixing debt #01) is also missing from it.

## Expected fix

**Option A — Delete**: if the grouping is not used in CLI adapters or integration tests, remove `ArgosRag`.

**Option B — Use**: if `ArgosRag` is intended to serve as a facade for a secondary adapter (CLI, integration tests), actually use it and add `ICheckResponseGrounding` and `IConversationService` to it.
