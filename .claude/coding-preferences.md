# Coding Preferences

## Hexagonal Architecture

```
api/         → REST input adapter
cli/         → CLI input adapter
app-ports/   → application port interfaces
app/         → use-case implementations
domain/      → entities, value objects
infra-ports/ → infrastructure port interfaces
infra/       → adapter implementations
```

- `domain`: no imports from other layers.
- `app`: no imports from `infra` or `api`; always go through ports.
- Infra adapters must implement an `infra-ports` interface.

## Code Style

- Interface methods must have comments. Body comments only if **why** is non-obvious.
- Explicit types; no `any`, no unused imports/variables, no dead code.
- One responsibility per function/class; split if description needs "and".
- Functions under 20 lines; extract nested or hard-to-name logic.
- Names reveal intent — avoid bare `data`, `info`, `manager`, `handler`.
- Named constants over magic values; early returns over nested `if/else`.
- Side effects and I/O at the edges; one abstraction level per function body.
- Extract duplication only when the abstraction has a clear name.
- Delete dead code — never comment it out.

## Barrel Exports

Import from the folder, not the file:

```ts
// ✅
import type { IAction } from "../app-ports/dir";
// ❌
import type { IAction } from "../../app-ports/dir/IAction";
```

## Tests

- **Unit**: app/domain logic; in-memory fakes for repos, spies for adapters. Next to source file.
- **Integration**: real database. Excluded from CI.
- **E2E**: quality checks. Excluded from CI.
- Factory functions (`makeXxx()`) for test data; app tests must not import from `infra/`.

## Architecture Decisions

Read ADRs in `docs/decisions/` before significant decisions; create/update one per significant decision.
Format: `ADR-NNN-short-title.md` — sections: Context, Options Considered, Decision, Consequences.

## Bug Documentation

Use `/record-bug` for: non-trivial root cause, likely to recur. Read existing docs for recurring issues.

## Tech Debt

Use `/record-tech-debt` when identifying a violation of architecture rules or a design shortcut worth tracking. Read `docs/tech-debt/` before raising a known issue.

## Domain Language

Glossary is authoritative — keep it up to date. Never invent synonyms; propose options before adding terms.

## Commit Policy

- One logical change per commit; split large tasks into independently-working commits.
- Run typecheck, lint, tests before committing — fix failures first.
- Format: `<type>: <short imperative description>` — types: `feat`, `fix`, `refac`, `test`, `docs`, `chore`.
- Never commit `.env`, secrets, credentials, or build artifacts.
