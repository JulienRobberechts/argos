# [TECH DEBT] ConversationService is a pure passthrough

**Affected layer:** `app/rag/ConversationService.ts`

## Problem

All 5 service methods delegate directly to the repository with no transformation:

```typescript
save(conversation: Conversation): Promise<void> {
  return this.repo.save(conversation);
}
findAll(): Promise<ConversationSummary[]> {
  return this.repo.findAll();
}
// same for findById, updateTitle, delete
```

The tests in `ConversationService.test.ts` test repository behaviour, not application logic.

## Impact

- Useless indirection layer with no added value today
- Tests verify no business rules
- The service will likely grow over time (design debt)

## Expected fix

Two options:

**Option A — Enrich the service**: move the business logic currently scattered elsewhere into it (conversation creation with defaults from debt #03, validation, etc.).

**Option B — Remove the service**: expose `IConversationRepository` directly via `app-ports` if no logic is planned, and wire the repository directly in the router (renaming the interface appropriately).

Option A is recommended because debt #03 requires exactly a place in `app` to handle creation.
