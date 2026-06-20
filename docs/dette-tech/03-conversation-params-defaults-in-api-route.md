# [TECH DEBT] ConversationParams defaults logic in the API route

**Affected layer:** `api/routes/conversations.ts` (lines 69–83)

## Problem

The `POST /conversations` HTTP route builds `ConversationParams` with all default values from `config`:

```typescript
params: ConversationParams.create({
  retrievalLimit: p.retrievalLimit ?? config.rag.retrievalLimit,
  rerankEnabled: p.rerankEnabled ?? config.rerank.enabled,
  llmModel: p.llmModel ?? config.llm.anthropic.model,
  // ... 6 more fields
})
```

Deciding what the default parameters of a conversation are is a business rule.
It belongs in the `app` layer, not in the HTTP router.

## Impact

- Defaults logic is only testable through API integration tests
- The route has full knowledge of the `config` structure (LLM, rerank, RAG)
- Any change to a default value requires modifying the router

## Expected fix

Add a `create(overrides?)` method to `ConversationService` (or a `CreateConversation` use case):

```typescript
// app/rag/ConversationService.ts
create(overrides?: Partial<ConversationParams>): Conversation {
  return {
    id: randomUUID(),
    title: "New conversation",
    params: ConversationParams.create({ ...this.defaults, ...overrides }),
    messages: [],
    createdAt: new Date(),
  };
}
```

Defaults are injected via the constructor from `registry.ts`.
The route only passes the overrides provided by the client.
