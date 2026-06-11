import { useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useConversation,
  useCreateConversation,
  useUpdateConversationTitle,
} from "../../hooks/useConversation";
import { useSSEStream } from "../../hooks/useSSEStream";
import { useConfig } from "../../hooks/useConfig";
import MessageList from "./MessageList";
import { useState, useRef, useEffect } from "react";
import { ArrowUp, Pencil, Settings2 } from "lucide-react";
import type {
  ConversationParams,
  KnowledgeCheckStrategy,
} from "../../types/domain";

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

const RERANK_MODELS = [
  { value: "rerank-2.5", label: "rerank-2.5" },
  { value: "rerank-2.5-lite", label: "rerank-2.5-lite" },
  { value: "rerank-2", label: "rerank-2" },
  { value: "rerank-lite-1", label: "rerank-lite-1" },
];

const LLM_MODELS = [
  { value: "claude-fable-5", label: "Claude Fable 5 (le plus capable)" },
  { value: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (rapide)" },
  { value: "claude-opus-4-7", label: "Claude Opus 4.7 (legacy)" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6 (legacy)" },
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 (legacy)" },
  { value: "claude-opus-4-5-20251101", label: "Claude Opus 4.5 (legacy)" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1 mb-0.5">
      {children}
    </p>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-indigo-500" : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-default" : ""}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ParamsPanel({
  params,
  onChange,
  readOnly = false,
}: {
  params: Partial<ConversationParams>;
  onChange?: (p: Partial<ConversationParams>) => void;
  readOnly?: boolean;
}) {
  const fieldClass = readOnly
    ? "w-20 text-xs text-right border border-gray-100 rounded-md px-2 py-1 bg-gray-50 text-gray-400 cursor-default"
    : "w-20 text-xs text-right border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-gray-50";

  return (
    <div
      className={`bg-white border rounded-xl px-5 py-4 flex flex-col gap-2.5 w-full max-w-2xl shadow-sm ${readOnly ? "border-gray-100" : "border-gray-200"}`}
    >
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-gray-700">Parameters</p>
        {readOnly && (
          <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 leading-none">
            read-only
          </span>
        )}
      </div>
      <div className="h-px bg-gray-100" />

      <SectionLabel>Retrieval</SectionLabel>
      <Row label="Results limit">
        <input
          type="number"
          value={params.retrievalLimit ?? 5}
          min={1}
          max={20}
          readOnly={readOnly}
          onChange={
            readOnly
              ? undefined
              : (e) =>
                  onChange?.({
                    ...params,
                    retrievalLimit: parseFloat(e.target.value),
                  })
          }
          className={fieldClass}
        />
      </Row>
      <Row label="Min similarity score">
        <input
          type="number"
          value={params.retrievalMinScore ?? 0.5}
          min={0}
          max={1}
          step={0.05}
          readOnly={readOnly}
          onChange={
            readOnly
              ? undefined
              : (e) =>
                  onChange?.({
                    ...params,
                    retrievalMinScore: parseFloat(e.target.value),
                  })
          }
          className={fieldClass}
        />
      </Row>
      <Row label="Reranking">
        <Toggle
          checked={params.rerankEnabled ?? false}
          onChange={
            readOnly
              ? () => {}
              : (v) => onChange?.({ ...params, rerankEnabled: v })
          }
          disabled={readOnly}
        />
      </Row>
      {params.rerankEnabled && (
        <Row label="Rerank model">
          <select
            value={params.rerankModel ?? RERANK_MODELS[0].value}
            disabled={readOnly}
            onChange={
              readOnly
                ? undefined
                : (e) => onChange?.({ ...params, rerankModel: e.target.value })
            }
            className={`text-xs border rounded-md px-2 py-1 outline-none bg-gray-50 text-gray-700 ${readOnly ? "border-gray-100 text-gray-400 cursor-default" : "border-gray-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"}`}
          >
            {RERANK_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Row>
      )}
      {params.rerankEnabled && (
        <Row label="Rerank candidate multiplier">
          <input
            type="number"
            value={params.rerankCandidateMultiplier ?? 3}
            min={1}
            max={10}
            readOnly={readOnly}
            onChange={
              readOnly
                ? undefined
                : (e) =>
                    onChange?.({
                      ...params,
                      rerankCandidateMultiplier: parseFloat(e.target.value),
                    })
            }
            className={fieldClass}
          />
        </Row>
      )}

      <div className="h-px bg-gray-100" />
      <SectionLabel>Generation</SectionLabel>
      <Row label="Model">
        <select
          value={params.llmModel ?? LLM_MODELS[0].value}
          disabled={readOnly}
          onChange={
            readOnly
              ? undefined
              : (e) => onChange?.({ ...params, llmModel: e.target.value })
          }
          className={`text-xs border rounded-md px-2 py-1 outline-none bg-gray-50 text-gray-700 ${readOnly ? "border-gray-100 text-gray-400 cursor-default" : "border-gray-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"}`}
        >
          {LLM_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </Row>
      <Row label="Temperature">
        <input
          type="number"
          value={params.llmTemperature ?? 0.2}
          min={0}
          max={1}
          step={0.05}
          readOnly={readOnly}
          onChange={
            readOnly
              ? undefined
              : (e) =>
                  onChange?.({
                    ...params,
                    llmTemperature: parseFloat(e.target.value),
                  })
          }
          className={fieldClass}
        />
      </Row>
      <Row label="Max tokens">
        <input
          type="number"
          value={params.llmMaxTokens ?? 1024}
          min={64}
          max={8192}
          readOnly={readOnly}
          onChange={
            readOnly
              ? undefined
              : (e) =>
                  onChange?.({
                    ...params,
                    llmMaxTokens: parseFloat(e.target.value),
                  })
          }
          className={fieldClass}
        />
      </Row>

      <div className="h-px bg-gray-100" />
      <SectionLabel>Knowledge Check</SectionLabel>
      {(
        [
          "faithfulness",
          "counterfactual",
          "citation_forcing",
        ] as KnowledgeCheckStrategy[]
      ).map((strategy) => {
        const active = (params.knowledgeCheckStrategies ?? []).includes(
          strategy,
        );
        const label =
          strategy === "faithfulness"
            ? "Faithfulness (RAGAS)"
            : strategy === "counterfactual"
              ? "Counterfactual"
              : "Citation forcing";
        return (
          <Row key={strategy} label={label}>
            <Toggle
              checked={active}
              onChange={(v) => {
                if (readOnly) return;
                const current = params.knowledgeCheckStrategies ?? [];
                onChange?.({
                  ...params,
                  knowledgeCheckStrategies: v
                    ? [...current, strategy]
                    : current.filter((s) => s !== strategy),
                });
              }}
              disabled={readOnly}
            />
          </Row>
        );
      })}
    </div>
  );
}

export default function ChatInterface() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const createConversation = useCreateConversation();
  const { data: conversation, isLoading } = useConversation(id ?? null);
  const { data: appConfig } = useConfig();
  const [input, setInput] = useState("");
  const [showParams, setShowParams] = useState(false);
  const [pendingParams, setPendingParams] = useState<
    Partial<ConversationParams>
  >({});
  const stream = useSSEStream(id ?? "");
  const pendingSentRef = useRef(false);

  useEffect(() => {
    if (appConfig && Object.keys(pendingParams).length === 0) {
      setPendingParams({
        retrievalLimit: appConfig.rag.retrievalLimit,
        retrievalMinScore: appConfig.rag.retrievalMinScore,
        rerankEnabled: appConfig.rag.reranking.enabled,
        rerankModel: appConfig.rag.reranking.model,
        rerankCandidateMultiplier: 3,
        llmModel: appConfig.llm.model,
        llmTemperature: appConfig.llm.temperature,
        llmMaxTokens: appConfig.llm.maxTokens,
        knowledgeCheckStrategies: [],
      });
    }
  }, [appConfig]);

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
    const conv = await createConversation.mutateAsync(pendingParams);
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

  useEffect(() => {
    if (!isEmpty) setShowParams(false);
  }, [isEmpty]);

  const emptyState = (disabled: boolean) => (
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
      <p className="text-gray-400 text-sm">
        Ask anything about your knowledge base
      </p>
      <div className="w-full max-w-2xl flex flex-col gap-3">
        <div className="flex justify-end">
          <button
            onClick={() => setShowParams((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              showParams
                ? "border-indigo-300 bg-indigo-50 text-indigo-600"
                : "border-gray-200 bg-white text-gray-400 hover:text-gray-600"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Parameters
          </button>
        </div>
        {showParams && (
          <ParamsPanel params={pendingParams} onChange={setPendingParams} />
        )}
        <InputForm
          input={input}
          setInput={setInput}
          onSubmit={submit}
          disabled={disabled}
        />
      </div>
    </div>
  );

  if (!id) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {emptyState(createConversation.isPending)}
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
        emptyState(stream.isStreaming)
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <MessageList
              messages={conversation.messages}
              streamingText={stream.isStreaming ? stream.text : undefined}
              streamingSources={stream.sources}
              streamingKnowledgeCheck={stream.knowledgeCheck}
              isStreaming={stream.isStreaming}
            />
          </div>
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="max-w-3xl mx-auto flex flex-col gap-2">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowParams((v) => !v)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    showParams
                      ? "border-indigo-300 bg-indigo-50 text-indigo-600"
                      : "border-gray-200 bg-white text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Parameters
                </button>
              </div>
              {showParams && (
                <ParamsPanel params={conversation.params} readOnly />
              )}
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
