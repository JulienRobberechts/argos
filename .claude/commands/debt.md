---
allowed-tools: Read, Edit, Bash(ls:*, find:*), Write
description: Record a tech debt item into docs/tech-debt/.
---

Your task is to create a tech debt file in `docs/tech-debt/` based on what was discussed in this session.

## Steps

1. **Find the next number**: run `ls docs/tech-debt/` and look at existing `NN-*.md` files. Pick the next available number (zero-padded to 2 digits).

2. **Identify the tech debt from this session**: extract from the conversation:
   - A short title (kebab-case, 3–6 words)
   - The affected layer or file(s)
   - The problem (what is wrong with the current state)
   - The impact (why it matters: testability, coupling, readability…)
   - The expected fix (concrete direction, code sketch if helpful)

3. **Create the file** at `docs/tech-debt/NN-short-title.md` using this exact template:

```
# [TECH DEBT] Short title

**Affected layer:** `path/to/affected/file.ts`

## Problem

Describe what is wrong with the current implementation.

## Impact

- Bullet list of consequences (testability, coupling, hidden dependencies…)

## Expected fix

Describe the direction to fix it. Include a code sketch if it helps clarify the intent.
```

## Rules

- Write in **English**.
- Be factual and concise — no padding.
- If no clear tech debt was identified in this session, say so and do nothing.
- After creating the file, print its path and a one-sentence summary of the debt item.
