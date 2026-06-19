# Project Context: Argos DevKnowledge

RAG application (Retrieval-Augmented Generation) for internal knowledge management.

## Stack

- **Backend**: Node.js / TypeScript, Express 5, Vitest, Biome
- **Frontend**: React 19 / TypeScript, Vite, Tailwind CSS 4, Biome
- **DB**: PostgreSQL
- **Storage**: Cloudflare R2 (compatible AWS S3)
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`)
- **Infra**: Docker Compose in dev, Docker in prod on Railway

## Hexagonal Architecture

The backend follows **hexagonal architecture** (ports & adapters). Strictly enforce layer boundaries:

```
api/             → Express routes — depends only on app-ports

app-ports/       → application port interfaces (use-case contracts)
application/     → use-case implementations — depends only on ports, never on infrastructure

domain/          → entities, value objects — no dependencies on other layers

infra-ports/     → infrastructure port interfaces (DB, storage, LLM, etc.)
infrastructure/  → adapter implementations of infra-ports
```

Rules:
- `domain` must not import from any other layer.
- `application` must not import from `infrastructure` or `api`.
- New use cases must define or reuse ports; never call infrastructure directly from `application`.
- New infrastructure adapters must implement an existing `infra-ports` interface.

## Domain Language

- `docs/glossary.md` is the authoritative source for domain terms — keep it up to date with precise definitions.
- Always use domain language in code and documentation; never invent synonyms for defined terms.
- When a new term is needed, propose several options to the user before adding it to the glossary.

## Tests

Three test categories, all run with Vitest:

- **Unit** (`src/**/*.test.ts`): application and domain logic. Use in-memory fakes from `tests/fakes/` for repositories; use `vi.fn()` for external adapters (LLM, storage, embeddings). Never use real infrastructure.
- **Integration** (`tests/integration/**`): infrastructure adapters against a real PostgreSQL database. Excluded from CI (`npm run test` in CI skips them).
- **Retrieval** (`tests/retrieval/**`): end-to-end RAG quality checks. Excluded from CI.

Rules:
- Place unit tests next to their source file.
- Use factory functions (`makeXxx()`) for test data — never inline raw objects.
- Application-layer tests must not import from `infrastructure/`.
- Do not mock the database — use fakes or hit a real DB (integration tests).

## Common Commands

### Backend (`/backend`)

```bash
npm run dev          # start dev server (tsx watch)
npm run test         # run tests (vitest)
npm run typecheck    # TypeScript check
npm run check        # Biome lint + format
npm run migrate      # run DB migrations
```

### Frontend (`/frontend`)

```bash
npm run dev          # start Vite dev server
npm run typecheck    # TypeScript check
npm run check        # Biome lint + format
```
