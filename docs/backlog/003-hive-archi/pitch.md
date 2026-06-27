# Pitch: Hive Architecture — Two Hexagonal Bounded Contexts

## Background

Argos is currently structured **layer-first**: `api/`, `app/`, `domain/`, `infra/` live at the top level, and feature namespaces (`rag/`, `knowledgeBase/`, `quiz/`) nest inside each layer.

```
src/
  api/
  app/
    rag/
    knowledgeBase/
    quiz/
  domain/
  infra/
```

This works fine for a single bounded context. It breaks down as soon as a second, independent domain is added — in this case, **subscription management**. Subscriptions have their own entities, rules, and persistence model. Flattening them into the same `app/subscription/` would make the `domain/` folder a mix of two unrelated models with no enforced boundary.

---

## Problem

Adding subscription management to the current structure creates two risks:

| Risk | Why |
|---|---|
| Domain leakage | `domain/` would mix RAG and subscription entities — no structural barrier prevents cross-domain imports |
| Implicit coupling | RAG use-cases could directly import subscription services, bypassing any port contract |
| No scalability path | A third context (e.g. analytics, billing) would make the flat structure untenable |

---

## Proposed Solution: Context-First "Hive" Structure

Reorganize to **context-first**: each bounded context owns a complete hexagonal stack. The project becomes a hive — independent cells, each structurally identical.

```
src/
  rag/                    ← RAG bounded context (current logic migrated here)
    api/
    app/
    app-ports/
    domain/
    infra-ports/
    infra/
  subscription/           ← Subscription bounded context (new)
    api/
    app/
    app-ports/
    domain/
    infra-ports/
    infra/
  shared/                 ← Shared kernel: only cross-context value objects (UserId, Money…)
  server.ts               ← Composition root: wires both contexts into a single Express app
```

Each context is isolated: imports stay within its own folder tree. `shared/` is the only legal cross-context dependency.

---

## Do We Need an ACL?

Yes — the two contexts communicate in both directions:

| Direction | Need |
|---|---|
| RAG → Subscription | Before executing a query, RAG must check whether the user is entitled (quota, active plan) |
| Subscription → RAG | After a query executes, Subscription must record the usage event |

Without an ACL, these interactions would import types across context boundaries and create hidden coupling.

### Design

**Entitlement check (synchronous port):**

```
rag/app-ports/
  IEntitlementPort.ts       ← canExecuteQuery(userId): Promise<Entitlement>

subscription/infra/
  EntitlementAdapter.ts     ← implements IEntitlementPort
                               translates SubscriptionPlan → Entitlement
```

RAG's app layer calls `IEntitlementPort` — it knows nothing about subscription plans. The adapter, living in subscription's infra, performs the translation (ACL).

**Usage recording (domain event):**

```
rag/domain/
  QueryExecutedEvent.ts     ← RAG emits this after a successful query

subscription/infra/
  UsageEventHandler.ts      ← listens to QueryExecutedEvent
                               calls subscription app layer to record usage
```

RAG emits an event using its own vocabulary (`QueryExecutedEvent`). Subscription's infra adapter translates it into a subscription domain operation (`recordUsage`). RAG never imports from `subscription/`.

### Event bus

An in-process synchronous event bus is sufficient (a simple `EventEmitter` wrapper registered in `server.ts`). No message broker required at this stage.

---

## Cross-Context Rules

| Allowed | Forbidden |
|---|---|
| `rag/` → `shared/` | `rag/app/` → `subscription/app/` |
| `subscription/` → `shared/` | `subscription/domain/` → `rag/domain/` |
| `subscription/infra/` implements `rag/app-ports/IEntitlementPort` | Any context → another context's `domain/` |

The adapter dependency is intentional and one-directional: subscription's infra knows how to fulfill RAG's port contract. This is the Anti-Corruption Layer.

---

## Architecture Summary

```
┌──────────────────────────────────┐   ┌────────────────────────────────────────┐
│          RAG context             │   │        Subscription context            │
│                                  │   │                                        │
│  api ──► app ──► app-ports       │   │  api ──► app ──► app-ports             │
│          │         │             │   │          │         │                   │
│       domain   infra-ports       │   │       domain   infra-ports             │
│                    │             │   │                    │                   │
│                  infra           │   │                  infra                 │
│                    │             │   │            ┌───────┴──────────┐        │
│                    │             │   │            │ EntitlementAdapter│        │
│                    │             │   │            │  (implements RAG's│        │
│                    │             │   │            │  IEntitlementPort)│        │
└──────────────────────────────────┘   └───────────┴──────────────────┴────────┘
         │                 ▲                  │               ▲
         │ IEntitlementPort│                  │               │
         └─────────────────┘     QueryExecutedEvent ─────────┘
                           shared/
```

---

## Migration Path

1. **Create context folders** — `src/rag/`, `src/subscription/`, `src/shared/` — without moving code yet.
2. **Move RAG** — relocate current `api/`, `app/rag/`, `app-ports/rag/`, `domain/`, `infra-ports/`, `infra/` into `src/rag/`. Update all imports.
3. **Build `subscription/`** — new context, start from scratch with its own hexagonal layers.
4. **Wire ACL** — add `IEntitlementPort` to `rag/app-ports/`, implement in `subscription/infra/`. Add event bus + `UsageEventHandler`.
5. **Update `server.ts`** — single composition root wires both contexts.

Steps 1–2 are a pure refactor (no logic changes). Steps 3–5 are new feature work.

---

## Out of Scope

- Separate npm packages or workspaces (context isolation via folder convention is sufficient at current scale).
- Message broker / async queue (in-process event bus covers the use case).
- Auth/authorization model (tracked separately — `IEntitlementPort` is the integration point, not an auth layer).
- Moving `quiz/` and `admin/` into the RAG context (they are operational tools, not business domains — migrate separately or leave flat if they stay small).
