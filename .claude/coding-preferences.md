# Coding Preferences

<!-- SCOPE: Generic engineering practices only — no project names, stack choices, or tool-specific APIs.
     Allowed exceptions: folder names that encode an architectural preference (e.g. hexagonal layer names),
     and recommended doc paths (docs/decisions/, docs/bugs/, docs/learnings/) treated as conventions.
     All other project-specific details belong in project-context.md. -->

## Hexagonal Architecture

Backend follows **hexagonal architecture** (ports & adapters):

```
api/             → REST input adapter
cli/             → CLI input adapter
app-ports/       → application port interfaces
app/             → use-case implementations
domain/          → entities, value objects
infra-ports/     → infrastructure port interfaces
infrastructure/  → adapter implementations
```

Rules:
- `domain` has no imports from other layers.
- `app` must not import from `infrastructure` or `api`.
- Use cases must go through ports — never call infrastructure directly.
- Infrastructure adapters must implement an `infra-ports` interface.

## Code Style

- Interface methods must have comments. No body comments unless the **why** is non-obvious.
- Explicit types over `any`; no unused imports, variables, or dead code.
- One responsibility per function/class — split if "and" is needed to describe it.
- Functions under 20 lines; extract nested or hard-to-name logic.
- Names reveal intent — avoid `data`, `info`, `manager`, `handler` without context.
- Named constants over magic values; early returns over nested `if/else`.
- Isolate side effects and I/O at the edges; one abstraction level per function body.
- Extract duplication only when the abstraction has a clear name and purpose.
- Delete dead code — never comment it out.
- **Consistent abstraction level**: a function body should operate at one level of abstraction.

## Tests

- **Unit**: app/domain logic; in-memory fakes for repos, spy/mock functions for adapters. Next to source file.
- **Integration**: real database. Excluded from CI.
- **E2E**: quality checks. Excluded from CI.
Factory functions (`makeXxx()`) for test data; app tests must not import from `infrastructure/`.

## Architecture Decisions

Before making a significant technical decision, read existing ADRs in `docs/decisions/` for context.
Create or update an ADR for every significant technical decision.
Format: `ADR-NNN-short-title.md` — sections: Context, Options Considered, Decision, Consequences.

## Bug Documentation

Use the `/record-bug` skill to document a bug when all three conditions hold:
- Non-trivial root cause (not an obvious typo or config mistake)
- Worth remembering long-term (subtle, took real time to diagnose)
- Likely to recur (systemic, library-level, or architectural)

Read existing bug docs when investigating a recurring or unexplained issue.

## Domain Language

The glossary is the authoritative source — keep it up to date. Never invent synonyms; propose options before adding new terms.

## Commit Policy

- One logical change per commit; split large tasks into independently-working commits.
- Run typecheck, lint, and tests before committing — fix failures first.
- Format: `<type>: <short imperative description>` — types: `feat`, `fix`, `refac`, `test`, `docs`, `chore`.
- Never commit `.env`, secrets, credentials, or build artifacts.
