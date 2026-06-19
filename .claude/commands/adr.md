---
allowed-tools: Read, Edit, Bash(ls:*, find:*), Write
description: Document a technical decision into docs/decisions/ as an ADR using the standard template.
---

Your task is to create an ADR (Architecture Decision Record) in `docs/decisions/` based on either the `$ARGUMENTS` provided or the last significant technical decision discussed in this session.

## Steps

1. **Find the next ADR number**: run `ls docs/decisions/` and look at existing `ADR-NNN-*.md` files. Pick the next available number (zero-padded to 3 digits).

2. **Identify the decision**:
   - If `$ARGUMENTS` is provided, use it as the subject of the ADR.
   - Otherwise, look at the conversation history and extract the most recent significant technical decision (architecture choice, library selection, pattern adoption, infrastructure change, etc.).

   Extract:
   - A short title (kebab-case, 3–6 words)
   - The context: why a decision was needed
   - The options considered (at least two, even if one was briefly dismissed)
   - The decision taken and the rationale
   - The consequences: trade-offs, new constraints, what becomes easier or harder

3. **Determine status**:
   - `Accepted` — decision is in effect
   - `Proposed` — under discussion, not yet implemented
   - `Deprecated` — superseded by a later ADR (link to it)

4. **Create the file** at `docs/decisions/ADR-NNN-short-title.md` using this exact template:

```
# ADR-NNN — Full Title

**Date**: YYYY-MM-DD
**Status**: Accepted | Proposed | Deprecated

## Context

Why a decision was needed here.

## Options Considered

- **Option A** — description. Pros / cons.
- **Option B** — description. Pros / cons.

## Decision

What was decided and why.

## Consequences

Trade-offs introduced. What becomes easier or harder. New constraints.
```

Replace `YYYY-MM-DD` with today's date.

## Updating an existing ADR

If `$ARGUMENTS` refers to an existing ADR (by number or title), update it instead of creating a new one:
- Changing **Status** (e.g. Proposed → Accepted, Accepted → Deprecated) is always allowed.
- When deprecating, add a note in the **Consequences** section pointing to the superseding ADR.
- Do not rewrite the history — only append or update the Status line and Consequences.

## Rules

- Write in **English**.
- Be factual and concise — no padding.
- Options Considered must list at least two alternatives (even if one was quickly ruled out).
- If no clear technical decision was made in this session and no `$ARGUMENTS` provided, say so and do nothing.
- After creating or updating the file, print its path and a one-sentence summary of the decision.
