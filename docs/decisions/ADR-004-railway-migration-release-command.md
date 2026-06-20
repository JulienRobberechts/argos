# ADR-004 — Railway releaseCommand for DB Migrations

**Date**: 2026-06-20
**Status**: Accepted

## Context

Database migrations must run on every production deployment. Previously this was a manual step (`railway run ... migrate.js`) documented in SETUP_PROD.md but not enforced, creating a risk of deploying code against an outdated schema.

## Options Considered

- **A — CMD in Dockerfile** — run `migrate.js && node dist/index.js` as the container start command. Simple, no Railway-specific config. Cons: migrations run on every container restart (not just deploys), and a migration failure causes Railway to loop-restart the container.
- **B — Railway `releaseCommand`** — configure `releaseCommand = "node dist/infra/persistence/db/migrate.js"` in `railway.toml`. Runs once per deploy, before new instances receive traffic. If it fails, the deploy is aborted and the previous version stays live.
- **C — Dedicated migration service** — a separate Railway service that runs migrations as a one-off job before the API deploys. Cleanest separation, but significantly more complex for no gain at this scale.

## Decision

Option B: `releaseCommand` in `backend/railway.toml`. Migrations are idempotent (all SQL files re-run safely), so the once-per-deploy semantic is safe and the failure-aborts-deploy guarantee is the key benefit.

## Consequences

- Migrations run automatically on every `railway up` — no manual step required.
- A failed migration aborts the deploy; the running version is preserved.
- Railway resource limits (`[resources]`) were evaluated but left at defaults — actual CPU/RAM consumption is low (network-bound workload); revisit after observing Metrics in the dashboard.
