import type { ConversationParams, ResponseGroundingResult, SourceCitation } from "../types/domain";
import { setOnUnauthorized, UnauthorizedError } from "./api";

export { setOnUnauthorized };

interface SSEHandlers {
  onDelta: (token: string) => void;
  onSources: (sources: SourceCitation[]) => void;
  onResponseGrounding: (results: ResponseGroundingResult[]) => void;
  onDone: (messageId: string) => void;
  onError: (error: string) => void;
}

interface CreateAndStreamHandlers extends SSEHandlers {
  onCreated: (conversationId: string) => void;
}

function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  handlers: CreateAndStreamHandlers,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  const processLines = (lines: string[]) => {
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ") && currentEvent) {
        const data = JSON.parse(line.slice(6)) as Record<string, unknown>;
        if (currentEvent === "created") handlers.onCreated(data.conversationId as string);
        else if (currentEvent === "delta") handlers.onDelta(data.token as string);
        else if (currentEvent === "sources") handlers.onSources(data.sources as SourceCitation[]);
        else if (currentEvent === "response_grounding")
          handlers.onResponseGrounding(data.results as ResponseGroundingResult[]);
        else if (currentEvent === "done") handlers.onDone(data.messageId as string);
        else if (currentEvent === "error") handlers.onError(data.error as string);
        currentEvent = "";
      }
    }
  };

  const pump = async (): Promise<void> => {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      processLines(lines);
    }
  };

  return pump();
}

export function createConversationAndStream(
  params: Partial<ConversationParams>,
  firstMessage: string,
  handlers: CreateAndStreamHandlers,
): () => void {
  const controller = new AbortController();

  const run = async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ firstMessage, params }),
      signal: controller.signal,
    });

    if (res.status === 401) {
      handlers.onError("Session expired");
      throw new UnauthorizedError();
    }
    if (!res.ok || !res.body) {
      handlers.onError("Failed to connect to stream");
      return;
    }

    await parseSSEStream(res.body.getReader(), handlers);
  };

  run().catch((err: unknown) => {
    if ((err as Error).name === "AbortError") return;
    if (err instanceof UnauthorizedError) return;
    handlers.onError("Stream error");
  });

  return () => controller.abort();
}

export function streamMessage(
  conversationId: string,
  content: string,
  handlers: SSEHandlers,
): () => void {
  const controller = new AbortController();

  const run = async () => {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
      signal: controller.signal,
    });

    if (res.status === 401) {
      handlers.onError("Session expired");
      throw new UnauthorizedError();
    }
    if (!res.ok || !res.body) {
      handlers.onError("Failed to connect to stream");
      return;
    }

    await parseSSEStream(res.body.getReader(), {
      ...handlers,
      onCreated: () => {},
    });
  };

  run().catch((err: unknown) => {
    if ((err as Error).name === "AbortError") return;
    if (err instanceof UnauthorizedError) return;
    handlers.onError("Stream error");
  });

  return () => controller.abort();
}
