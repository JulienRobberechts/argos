# [TECH DEBT] PgConversationRepository receives domain default ConversationParams

**Affected layer:** `registry.ts` (lines 35–48) + `infra/persistence/db/PgConversationRepository.ts`

## Problem

The repository receives default `ConversationParams` in its constructor:

```typescript
export const conversationRepo = new PgConversationRepository(
  ConversationParams.create({
    retrievalLimit: config.rag.retrievalLimit,
    llmModel: config.llm.anthropic.model,
    // ...
  }),
);
```

A repository is a pure persistence adapter. Passing business default values into its constructor mixes infrastructure and domain logic — the repository should not know what the default parameters of a conversation are.

## Impact

- Business defaults are scattered: API route (debt #03) + repository
- Testing the repository in isolation requires providing arbitrary `ConversationParams`
- Changing defaults → modifying an infra file

## Expected fix

Resolving debt #03 (adding a `create` use case in `ConversationService`) centralises the defaults in the `app` layer. `PgConversationRepository` no longer needs to know about them.

The repository constructor only takes persistence dependencies (connection pool).
