import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Bot } from "lucide-react";
import type { Message, SourceCitation } from "../../types/domain";
import SourceCard from "./SourceCard";
import StreamingMessage from "./StreamingMessage";

interface Props {
  messages: Message[];
  streamingText?: string;
  streamingSources?: SourceCitation[];
  isStreaming: boolean;
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mt-0.5">
        <Bot className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export default function MessageList({
  messages,
  streamingText,
  streamingSources,
  isStreaming,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-3xl mx-auto w-full">
      {messages.map((msg) =>
        msg.role === "user" ? (
          <div key={msg.id} className="flex justify-end">
            <div className="max-w-[75%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </div>
          </div>
        ) : (
          <AssistantBubble key={msg.id}>
            <div className="prose prose-sm prose-gray max-w-none">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
            {msg.sources.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {msg.sources.map((source) => (
                  <SourceCard key={source.chunkId} source={source} />
                ))}
              </div>
            )}
          </AssistantBubble>
        ),
      )}
      {isStreaming && streamingText !== undefined && (
        <AssistantBubble>
          <StreamingMessage text={streamingText} />
          {streamingSources && streamingSources.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {streamingSources.map((source) => (
                <SourceCard key={source.chunkId} source={source} />
              ))}
            </div>
          )}
        </AssistantBubble>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
