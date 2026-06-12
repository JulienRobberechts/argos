import { useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  useConversation,
  useCreateConversation,
  useUpdateConversationTitle,
} from "../../hooks/useConversation";
import { useSSEStream } from "../../hooks/useSSEStream";
import { useConfig } from "../../hooks/useConfig";
import MessageList from "./MessageList";
import { useState, useRef, useEffect } from "react";
import { ArrowUp, BookOpen, Info, Pencil, Settings2, X } from "lucide-react";
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

function Field({
  label,
  info,
  techLink,
  children,
}: {
  label: string;
  info?: string;
  techLink?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 min-h-[28px]">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-gray-500 leading-tight">{label}</span>
          {info && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-gray-300 hover:text-blue-500 transition-colors"
              aria-label={`About: ${label}`}
            >
              <Info size={11} />
            </button>
          )}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
      {open && info && (
        <div className="mt-1.5 text-[11px] text-gray-600 bg-blue-50/70 border-l-2 border-blue-300 rounded-r-md pl-2.5 pr-2 py-1.5 leading-relaxed">
          {info}
          {techLink && (
            <Link
              to={techLink}
              className="inline-flex items-center gap-0.5 ml-1.5 text-blue-500 hover:text-blue-700 font-medium transition-colors"
            >
              <BookOpen size={10} />
              En savoir plus
            </Link>
          )}
        </div>
      )}
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
      } ${disabled ? "opacity-50 cursor-default" : "cursor-pointer"}`}
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
  onClose,
}: {
  params: Partial<ConversationParams>;
  onChange?: (p: Partial<ConversationParams>) => void;
  readOnly?: boolean;
  onClose?: () => void;
}) {
  const inputClass = readOnly
    ? "w-16 text-xs text-right border border-gray-100 rounded-md px-2 py-1 bg-gray-50 text-gray-400 cursor-default"
    : "w-16 text-xs text-right border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white text-gray-700";

  const selectClass = `text-xs border rounded-md px-2 py-1 max-w-[140px] outline-none ${
    readOnly
      ? "bg-gray-50 border-gray-100 text-gray-400 cursor-default"
      : "bg-white border-gray-200 text-gray-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
  }`;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-800">Settings</p>
          {readOnly ? (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Read-only · active conversation
            </p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Applied to the next conversation
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        <section className="flex flex-col gap-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
            Retrieval
          </p>
          <Field
            label="Results limit"
            info="Maximum number of chunks retrieved from the vector index and injected into the LLM context. A higher value provides more context but may dilute relevance."
            techLink="/technical?tab=Config"
          >
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
              className={inputClass}
            />
          </Field>
          <Field
            label="Min similarity score"
            info="Cosine similarity threshold (0–1). Chunks with a score below this value are excluded from the context. A higher value filters out less relevant results."
            techLink="/technical?tab=Config"
          >
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
              className={inputClass}
            />
          </Field>
          <Field
            label="Reranking"
            info="Enables a second retrieval stage using a cross-encoder model to re-score and reorder candidates for improved relevance."
            techLink="/technical/reranking"
          >
            <Toggle
              checked={params.rerankEnabled ?? false}
              onChange={
                readOnly
                  ? () => {}
                  : (v) => onChange?.({ ...params, rerankEnabled: v })
              }
              disabled={readOnly}
            />
          </Field>
          {params.rerankEnabled && (
            <Field
              label="Rerank model"
              info="Cross-encoder model used for the reranking stage."
              techLink="/technical/reranking"
            >
              <select
                value={params.rerankModel ?? RERANK_MODELS[0].value}
                disabled={readOnly}
                onChange={
                  readOnly
                    ? undefined
                    : (e) =>
                        onChange?.({ ...params, rerankModel: e.target.value })
                }
                className={selectClass}
              >
                {RERANK_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {params.rerankEnabled && (
            <Field
              label="Candidate multiplier"
              info="Retrieves N × limit candidates before reranking, then keeps only the top limit. A higher value improves recall at the cost of latency."
              techLink="/technical/reranking"
            >
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
                className={inputClass}
              />
            </Field>
          )}
        </section>

        <div className="h-px bg-gray-100" />

        <section className="flex flex-col gap-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
            Generation
          </p>
          <Field
            label="Model"
            info="LLM used for response generation. More capable models produce better answers but are slower and more expensive."
            techLink="/technical/llm-models"
          >
            <select
              value={params.llmModel ?? LLM_MODELS[0].value}
              disabled={readOnly}
              onChange={
                readOnly
                  ? undefined
                  : (e) => onChange?.({ ...params, llmModel: e.target.value })
              }
              className={selectClass}
            >
              {LLM_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Temperature"
            info="Controls response creativity (0 = deterministic, 1 = very creative). A low value is recommended for factual answers."
            techLink="/technical?tab=Config"
          >
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
              className={inputClass}
            />
          </Field>
          <Field
            label="Max tokens"
            info="Maximum number of tokens the LLM can generate in a response. Increase this to allow longer answers."
            techLink="/technical?tab=Config"
          >
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
              className={inputClass}
            />
          </Field>
        </section>

        <div className="h-px bg-gray-100" />

        <section className="flex flex-col gap-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
            Knowledge check
          </p>
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
            const info =
              strategy === "faithfulness"
                ? "Checks whether each statement in the answer is supported by the retrieved sources (RAGAS metric)."
                : strategy === "counterfactual"
                  ? "Tests resistance to false context by injecting contradictory information into the sources."
                  : "Forces the model to cite its sources and verifies that the citations are accurate.";
            return (
              <Field
                key={strategy}
                label={label}
                info={info}
                techLink="/technical/knowledge-check"
              >
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
              </Field>
            );
          })}
        </section>
      </div>
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

  const settingsButton = (
    <button
      onClick={() => setShowParams((v) => !v)}
      title={showParams ? "Hide settings" : "Show settings"}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
        showParams
          ? "border-indigo-300 bg-indigo-50 text-indigo-600"
          : "border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      <Settings2 className="w-3.5 h-3.5" />
      Settings
    </button>
  );

  if (!id) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-gray-200 bg-white px-6 py-3 shrink-0 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">
              New conversation
            </span>
            {settingsButton}
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
            <p className="text-gray-400 text-sm">
              Ask anything about your knowledge base
            </p>
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
        {showParams && (
          <aside className="w-72 border-l border-gray-200 shrink-0 flex flex-col">
            <ParamsPanel
              params={pendingParams}
              onChange={setPendingParams}
              onClose={() => setShowParams(false)}
            />
          </aside>
        )}
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

  const isEmpty = conversation.messages.length === 0 && !stream.isStreaming;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-3 shrink-0 flex items-center justify-between">
        <EditableTitle id={conversation.id} title={conversation.title} />
        {settingsButton}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {isEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
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
                  streamingKnowledgeCheck={stream.knowledgeCheck}
                  isStreaming={stream.isStreaming}
                />
              </div>
              <div className="border-t border-gray-200 bg-white px-4 py-3 shrink-0">
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
        </main>

        {showParams && (
          <aside className="w-72 border-l border-gray-200 shrink-0 flex flex-col overflow-hidden">
            <ParamsPanel
              params={conversation.params}
              readOnly
              onClose={() => setShowParams(false)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
