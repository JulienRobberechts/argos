---
allowed-tools: Read, Edit, Bash(ls:*, find:*), Write
description: Document the last bug encountered in this session into docs/bugs/ using the standard template.
---

Your task is to create a bug record file in `docs/bugs/` based on what happened in this session.

## Steps

1. **Find the next bug number**: run `ls docs/bugs/` and look at existing `BUG-NNN-*.md` files. Pick the next available number (zero-padded to 3 digits).

2. **Identify the bug from this session**: look at the conversation history — the most recent bug discussed, debugged, or fixed. Extract:
   - A short title (kebab-case, 3–6 words)
   - The observed symptom (error message, unexpected behavior, reproduction steps)
   - The root cause
   - What was changed to fix it (with file paths and line numbers if relevant)
   - Lessons or things to watch out for

3. **Determine severity**:
   - `high` — data loss, crash, security issue, production outage
   - `medium` — significant malfunction, wrong output, hard-to-reproduce issue
   - `low` — cosmetic, minor edge case, inconvenience

4. **Create the file** at `docs/bugs/BUG-NNN-short-title.md` using this exact template:

```
# BUG-NNN — Short title

**Date**: YYYY-MM-DD
**Severity**: low | medium | high

## Symptom

What was observed (error message, unexpected behavior, reproduction steps).

## Root Cause

Why it happened.

## Fix

What was changed. Link to commit or PR if relevant.

## Lessons

What to watch out for / how to prevent recurrence.
```

Replace `YYYY-MM-DD` with today's date.

## Rules

- Write in **English**.
- Be factual and concise — no padding.
- If no clear bug was encountered in this session, say so and do nothing.
- Do not modify `BUG-000-template.md`.
- After creating the file, print its path and a one-sentence summary of the bug.
