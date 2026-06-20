# BUG-002 — First message not sent on new conversation

**Date**: 2026-06-20
**Severity**: high
**File**: `frontend/src/components/chat/ChatInterface.tsx`

## Symptom

When starting a new conversation with an initial message, the message is silently dropped — the question disappears from the input field but is never sent to the server. The conversation page loads (GET 304 returns `messages: []`) but no send call occurs. Reproducible every time a new conversation is initiated from a blank state.

## Root Cause

A race condition between `useEffect` re-runs and a one-shot guard ref in `ChatInterface.tsx:50–65`.

The flow:
1. User submits a message → app creates a conversation, navigates to `/conversations/:id` with `location.state.pendingMessage`.
2. `useEffect` fires, sees `pendingMessage`, sets `pendingSentForIdRef.current = id`, calls `navigate(..., { state: {} })` to clear state, then calls `stream.send(pending)`.
3. Because `stream.send` is in the dependency array, when `useSSEStream` returns a new stable `send` reference after `id` settles, the effect re-runs. By then `pendingSentForIdRef.current === id` is already true → early return → the guard blocks the real send if `stream.send` changed reference before the first run completed.

Three failed fixes (commits):
- **`85d6a86`** (Jun 12) — `useRef(false)` boolean guard, but cleanup (`return () => { ref.current = false }`) reset it on unmount → back-navigation re-sent the message.
- **`135c8b7`** (Jun 13) — replaced with `useRef<string | null>(null)` storing the conversation `id` + `navigate(..., { state: {} })` to clear navigation state. Fixed re-send, but introduced the deps-race: `stream.send` in deps causes effect re-run after guard is already set → send never fires.

## Fix

**Commit `d25e8fb`** — `frontend/src/components/chat/ChatInterface.tsx`

Three changes applied together:

1. **`streamRef`** — keeps `stream` current via a no-dep `useEffect`, so `stream.send` can be called inside the pending-message effect without being listed as a dependency.

2. **`window.history.replaceState`** — replaces `navigate(location.pathname, { replace: true, state: {} })`. Clears the navigation state in the browser history without going through React Router, so no re-render is triggered and the effect does not re-run spuriously.

3. **Narrowed deps array** — reduced from 6 entries (`id`, `stream.send`, `queryClient.invalidateQueries`, `navigate`, `location.pathname`, `location.state.pendingMessage`) to 3 (`id`, `pendingMessage`, `queryClient`). Only deps that should legitimately re-trigger the send are kept.

```tsx
const streamRef = useRef(stream);
useEffect(() => { streamRef.current = stream; });

const pendingMessage = (location.state as { pendingMessage?: string } | null)?.pendingMessage;

useEffect(() => {
  if (!pendingMessage || !id || pendingSentForIdRef.current === id) return;
  pendingSentForIdRef.current = id;
  window.history.replaceState({ ...window.history.state, usr: null }, "");
  streamRef.current.send(pendingMessage, () => {
    queryClient.invalidateQueries({ queryKey: ["conversations", id] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  });
}, [id, pendingMessage, queryClient]);
```

## Lessons

- Never put `stream.send` or other potentially unstable callbacks in a `useEffect` deps array when the effect is a one-shot guard. Use a ref instead.
- `navigate(..., { state: {} })` triggers React Router re-renders and can cause the same `useEffect` to re-fire — prefer `history.replaceState` to clear navigation state without a re-render.
- A boolean ref guard is not enough when the component unmounts/remounts (cleanup resets it) — key the ref to the conversation `id`.
- The cleanest fix eliminates client-side orchestration entirely: one API call that creates the conversation and queues the first message server-side.
- Add a test: navigate away from a new conversation and back, assert `messages.length === 1`.
