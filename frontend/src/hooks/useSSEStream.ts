import { useCallback, useEffect, useRef, useState } from "react";
import { streamMessage } from "../services/sse";
import type { KnowledgeCheckResult, SourceCitation } from "../types/domain";

export function useSSEStream(conversationId: string) {
  const [text, setText] = useState("");
  const [sources, setSources] = useState<SourceCitation[]>([]);
  const [knowledgeCheck, setKnowledgeCheck] = useState<KnowledgeCheckResult[] | undefined>(
    undefined,
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const closeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setText("");
    setSources([]);
    setKnowledgeCheck(undefined);
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
      setKnowledgeCheck(undefined);
      setIsStreaming(true);

      closeRef.current = streamMessage(conversationId, content, {
        onDelta: (token) => setText((t) => t + token),
        onSources: (s) => setSources(s),
        onKnowledgeCheck: (r) => setKnowledgeCheck(r),
        onDone: () => {
          setIsStreaming(false);
          onComplete?.();
        },
        onError: () => setIsStreaming(false),
      });
    },
    [conversationId],
  );

  return { text, sources, knowledgeCheck, isStreaming, send };
}
