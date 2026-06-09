import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  useConversation,
  useUpdateConversationTitle,
} from "../../hooks/useConversation";
import { useSSEStream } from "../../hooks/useSSEStream";
import MessageList from "./MessageList";
import { useState, useRef, useEffect } from "react";

function EditableTitle({ id, title }: { id: string; title: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTitle = useUpdateConversationTitle();

  useEffect(() => {
    setValue(title);
  }, [title]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) {
      updateTitle.mutate({ id, title: trimmed });
    } else {
      setValue(title);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
        className="text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-blue-500 outline-none w-full"
      />
    );
  }

  return (
    <h1
      className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
      onClick={() => setEditing(true)}
      title="Cliquer pour modifier le titre"
    >
      {title}
    </h1>
  );
}

export default function ChatInterface() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: conversation, isLoading } = useConversation(id ?? null);
  const [input, setInput] = useState("");
  const stream = useSSEStream(id ?? "");

  function submit() {
    const content = input.trim();
    if (!content || stream.isStreaming || !id) return;
    setInput("");
    stream.send(content, () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Chargement…
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Conversation introuvable
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-gray-200 px-8 pt-8 pb-4 shrink-0">
        <EditableTitle id={conversation.id} title={conversation.title} />
      </div>
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={conversation.messages}
          streamingText={stream.isStreaming ? stream.text : undefined}
          streamingSources={stream.sources}
          isStreaming={stream.isStreaming}
        />
      </div>
      <div className="border-t border-gray-200 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={stream.isStreaming}
            placeholder="Posez votre question…"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={stream.isStreaming || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
