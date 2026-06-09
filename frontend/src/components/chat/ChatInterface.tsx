import { useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useConversation,
  useCreateConversation,
  useUpdateConversationTitle,
} from "../../hooks/useConversation";
import { useSSEStream } from "../../hooks/useSSEStream";
import MessageList from "./MessageList";
import { useState, useRef, useEffect } from "react";
import { ArrowUp, Pencil } from "lucide-react";

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
        className="text-base font-semibold text-gray-800 bg-transparent border-b border-gray-400 outline-none w-full"
      />
    );
  }

  return (
    <button
      className="group flex items-center gap-1.5 text-base font-semibold text-gray-800 hover:text-gray-600 transition-colors"
      onClick={() => setEditing(true)}
      title="Edit title"
    >
      <span>{title}</span>
      <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  );
}

function InputForm({
  input,
  setInput,
  onSubmit,
  disabled,
}: {
  input: string;
  setInput: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="relative flex items-end gap-2 rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask a question…"
        rows={1}
        className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none min-h-[24px] max-h-[200px] leading-relaxed disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </form>
  );
}

export default function ChatInterface() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const createConversation = useCreateConversation();
  const { data: conversation, isLoading } = useConversation(id ?? null);
  const [input, setInput] = useState("");
  const stream = useSSEStream(id ?? "");
  const pendingSentRef = useRef(false);

  useEffect(() => {
    const pending = (location.state as { pendingMessage?: string } | null)
      ?.pendingMessage;
    if (!pending || !id || pendingSentRef.current) return;
    pendingSentRef.current = true;
    stream.send(pending, () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
  }, [id]);

  async function submitNew(content: string) {
    const conv = await createConversation.mutateAsync();
    navigate(`/conversations/${conv.id}`, {
      replace: true,
      state: { pendingMessage: content },
    });
  }

  function submit() {
    const content = input.trim();
    if (!content || stream.isStreaming) return;
    setInput("");
    if (!id) {
      void submitNew(content);
      return;
    }
    stream.send(content, () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
  }

  const isEmpty =
    !id ||
    (!!conversation &&
      conversation.messages.length === 0 &&
      !stream.isStreaming);

  if (!id) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Ask anything about your knowledge base
            </p>
          </div>
          <div className="w-full max-w-2xl">
            <InputForm
              input={input}
              setInput={setInput}
              onSubmit={submit}
              disabled={createConversation.isPending}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Conversation not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-3 shrink-0 flex items-center">
        <EditableTitle id={conversation.id} title={conversation.title} />
      </div>
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <p className="text-gray-400 text-sm">
            Ask anything about your knowledge base
          </p>
          <div className="w-full max-w-2xl">
            <InputForm
              input={input}
              setInput={setInput}
              onSubmit={submit}
              disabled={stream.isStreaming}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <MessageList
              messages={conversation.messages}
              streamingText={stream.isStreaming ? stream.text : undefined}
              streamingSources={stream.sources}
              isStreaming={stream.isStreaming}
            />
          </div>
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="max-w-3xl mx-auto">
              <InputForm
                input={input}
                setInput={setInput}
                onSubmit={submit}
                disabled={stream.isStreaming}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
