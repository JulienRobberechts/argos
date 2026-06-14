import { BookOpen, Info, Settings, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useConfig } from "../../hooks/useConfig";
import PageHeader from "../ui/PageHeader";

function Row({
  label,
  value,
  info,
  techLink,
}: {
  label: string;
  value: string | number;
  info: string;
  techLink?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-600">{label}</span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-slate-300 hover:text-[#d97706] transition-colors"
            aria-label={`About: ${label}`}
          >
            <Info size={12} />
          </button>
        </div>
        <span className="text-xs font-mono text-slate-900">{value}</span>
      </div>
      {open && (
        <div className="mt-1.5 text-xs text-slate-600 bg-amber-50 border-l-2 border-[#d97706] rounded-r-md pl-2.5 pr-2 py-1.5 leading-relaxed">
          {info}
          {techLink && (
            <Link
              to={techLink}
              className="inline-flex items-center gap-0.5 ml-1.5 text-[#d97706] hover:text-[#92400e] font-medium transition-colors"
            >
              <BookOpen size={11} />
              Learn more
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
        {title}
      </p>
      <div className="bg-white border border-slate-200 rounded-lg px-3">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage({ onClose }: { onClose?: () => void }) {
  const { data: config, isLoading, isError } = useConfig();

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          icon={<Settings className="text-[#d97706]" size={28} />}
          title="Settings"
          info="Argos system configuration. These values are set server-side via environment variables and displayed here as read-only."
        />
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors mt-1 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div>
        {isLoading && <p className="text-slate-400 text-xs">Loading…</p>}
        {isError && (
          <p className="text-red-500 text-xs">Failed to load configuration.</p>
        )}

        {config && (
          <>
            <Section title="General">
              <Row
                label="Log level"
                value={config.logLevel}
                info="Server log verbosity. Possible values: debug, info, warn, error."
              />
              <Row
                label="Storage backend"
                value={config.storage.backend}
                info="File storage mode. 'local' stores uploads on disk; 'r2' uses Cloudflare R2 object storage."
              />
            </Section>

            <Section title="RAG — Chunking">
              <Row
                label="Strategy"
                value={config.rag.chunkingStrategy}
                info="Document splitting method. 'sentence' respects sentence boundaries; 'recursive' splits into fixed-size blocks."
                techLink="/technical?tab=Ingestion"
              />
              <Row
                label="Chunk size (tokens)"
                value={config.rag.chunkSize}
                info="Maximum number of tokens per chunk. A larger chunk provides more context but may dilute relevance during retrieval."
                techLink="/technical?tab=Ingestion"
              />
              <Row
                label="Overlap (tokens)"
                value={config.rag.chunkOverlap}
                info="Number of tokens shared between consecutive chunks. Prevents ideas from being cut across two chunks."
                techLink="/technical?tab=Ingestion"
              />
            </Section>

            <Section title="Embeddings">
              <Row
                label="Provider"
                value={config.embeddings.provider}
                info="API used for vectorizing documents and queries."
                techLink="/technical?tab=Ingestion"
              />
              <Row
                label="Model"
                value={config.embeddings.model}
                info="Embedding model used for vectorizing documents and queries."
                techLink="/technical?tab=Ingestion"
              />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
