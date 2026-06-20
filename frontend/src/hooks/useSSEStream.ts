import { useCallback, useEffect, useRef, useState } from "react";
import { streamMessage } from "../services/sse";
import type { ResponseGroundingResult, SourceCitation } from "../types/domain";

export function useSSEStream(conversationId: string) {
  const [text, setText] = useState("");
  const [sources, setSources] = useState<SourceCitation[]>([]);
  const [responseGrounding, setResponseGrounding] = useState<ResponseGroundingResult[] | undefined>(
    undefined,
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const closeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setText("");
    setSources([]);
    setResponseGrounding(undefined);
    setIsStreaming(false);
    return () => {
      closeRef.current?.();
      closeRef.current = null;
    };
  }, []);

  const send = useCallback(
    (content: string, onComplete?: () => void) => {
      setText("");
      setSources([]);
      setResponseGrounding(undefined);
      setIsStreaming(true);

      closeRef.current = streamMessage(conversationId, content, {
        onDelta: (token) => setText((t) => t + token),
        onSources: (s) => setSources(s),
        onResponseGrounding: (r) => setResponseGrounding(r),
        onDone: () => {
          setIsStreaming(false);
          onComplete?.();
        },
        onError: () => setIsStreaming(false),
      });
    },
    [conversationId],
  );

  return { text, sources, responseGrounding, isStreaming, send };
}
