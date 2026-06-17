import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  DatabaseZap,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import { api } from "../../services/api";
import type {
  AppConfig,
  AppSettings,
  AppSettingsPatch,
  ConsistencyReport,
} from "../../types/domain";

// ─── Read-only primitives ─────────────────────────────────────────────────────

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

function SettingGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4">
      {children}
    </div>
  );
}

// ─── Config form (used only in ResetDialog) ───────────────────────────────────

function ProviderSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; available: boolean }[];
  onChange: (v: string) => void;
}) {
  const selectId = `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-xs text-slate-500">
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={!o.available}>
            {o.label}
            {!o.available ? " (not configured)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FormState {
  embeddingProvider: string;
  storageProvider: string;
  chunkingStrategy: "recursive" | "sentence";
  chunkSize: number;
  chunkOverlap: number;
}

function buildForm(settings: AppSettings, config: AppConfig): FormState {
  return {
    embeddingProvider: settings.embedding.provider,
    storageProvider: settings.storage.provider,
    chunkingStrategy: config.rag.chunkingStrategy,
    chunkSize: config.rag.chunkSize,
    chunkOverlap: config.rag.chunkOverlap,
  };
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      <input
        type="number"
        value={value}
        min={1}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
    </div>
  );
}

function DialogSubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

function ConfigForm({
  settings,
  form,
  onChange,
}: {
  settings: AppSettings;
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="space-y-5">
      <DialogSubSection title="Storage">
        <ProviderSelect
          label="Backend"
          value={form.storageProvider}
          options={settings.storage.options.map((o) => ({
            value: o.provider,
            label: o.label,
            available: o.available,
          }))}
          onChange={(v) => onChange({ storageProvider: v })}
        />
      </DialogSubSection>

      <DialogSubSection title="Chunking">
        <div className="space-y-4">
          <ProviderSelect
            label="Strategy"
            value={form.chunkingStrategy}
            options={[
              { value: "recursive", label: "Recursive", available: true },
              { value: "sentence", label: "Sentence", available: true },
            ]}
            onChange={(v) =>
              onChange({ chunkingStrategy: v as "recursive" | "sentence" })
            }
          />
          <NumberInput
            label="Chunk Size (tokens)"
            value={form.chunkSize}
            onChange={(v) => onChange({ chunkSize: v })}
          />
          <NumberInput
            label="Chunk Overlap (tokens)"
            value={form.chunkOverlap}
            onChange={(v) => onChange({ chunkOverlap: v })}
          />
        </div>
      </DialogSubSection>

      <DialogSubSection title="Embedding">
        <ProviderSelect
          label="Provider"
          value={form.embeddingProvider}
          options={settings.embedding.options.map((o) => ({
            value: o.provider,
            label: o.label,
            available: o.available,
          }))}
          onChange={(v) => onChange({ embeddingProvider: v })}
        />
      </DialogSubSection>
    </div>
  );
}

// ─── Storage & Embedding Sections ────────────────────────────────────────────

function StorageSection({ settings }: { settings: AppSettings }) {
  const label =
    settings.storage.options.find(
      (o) => o.provider === settings.storage.provider,
    )?.label ?? settings.storage.provider;

  return (
    <SettingGroup>
      <SettingRow label="Backend" value={label} />
    </SettingGroup>
  );
}

function EmbeddingSection({ settings }: { settings: AppSettings }) {
  const label =
    settings.embedding.options.find(
      (o) => o.provider === settings.embedding.provider,
    )?.label ?? settings.embedding.provider;

  return (
    <SettingGroup>
      <SettingRow label="Provider" value={label} />
    </SettingGroup>
  );
}

// ─── Chunking Section ─────────────────────────────────────────────────────────

function ChunkingSection({ config }: { config: AppConfig }) {
  return (
    <SettingGroup>
      <SettingRow label="Strategy" value={config.rag.chunkingStrategy} />
      <SettingRow label="Chunk Size (tokens)" value={config.rag.chunkSize} />
      <SettingRow
        label="Chunk Overlap (tokens)"
        value={config.rag.chunkOverlap}
      />
    </SettingGroup>
  );
}

// ─── Consistency Section ──────────────────────────────────────────────────────

function ConsistencySection() {
  const [report, setReport] = useState<ConsistencyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      setReport(await api.checkStorageConsistency());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={check}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
      >
        <DatabaseZap size={15} />
        {loading ? "Checking…" : "Check DB ↔ Storage consistency"}
      </button>

      {report && (
        <div
          className={`p-3 rounded-md border text-sm ${
            report.ok
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-orange-50 border-orange-200 text-orange-700"
          }`}
        >
          {report.ok ? (
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              Database and storage are consistent
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle size={16} />
                Inconsistencies detected
              </div>
              {report.orphanFiles.length > 0 && (
                <div>
                  <p className="font-medium text-xs uppercase tracking-wide mb-1">
                    Orphan files (storage without DB record)
                  </p>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    {report.orphanFiles.map((f) => (
                      <li key={f} className="font-mono">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.missingFiles.length > 0 && (
                <div>
                  <p className="font-medium text-xs uppercase tracking-wide mb-1">
                    Missing files (DB record without storage)
                  </p>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    {report.missingFiles.map((f) => (
                      <li key={f} className="font-mono">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Reset Dialog ─────────────────────────────────────────────────────────────

function ResetDialog({
  currentSettings,
  config,
  onClose,
  onSuccess,
}: {
  currentSettings: AppSettings;
  config: AppConfig;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [changeConfig, setChangeConfig] = useState(false);
  const [form, setForm] = useState<FormState>(() =>
    buildForm(currentSettings, config),
  );
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      const newSettings: AppSettingsPatch | undefined = changeConfig
        ? {
            embedding: { provider: form.embeddingProvider },
            storage: { provider: form.storageProvider },
            chunking: {
              strategy: form.chunkingStrategy,
              chunkSize: form.chunkSize,
              chunkOverlap: form.chunkOverlap,
            },
          }
        : undefined;
      await api.resetAll(newSettings);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">
              Update configuration before reset?
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Optional — you can reset without changing the configuration.
            </p>

            <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setChangeConfig((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium">Change configuration</span>
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform ${changeConfig ? "rotate-180" : ""}`}
                />
              </button>
              {changeConfig && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                  <ConfigForm
                    settings={currentSettings}
                    form={form}
                    onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm bg-slate-700 text-white hover:bg-slate-800 rounded-md transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-start gap-3 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle
                className="text-red-500 shrink-0 mt-0.5"
                size={18}
              />
              <p className="text-sm text-red-700">
                This action is irreversible. All data (documents, conversations,
                files) will be permanently deleted.
              </p>
            </div>

            {changeConfig && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                The configuration will also be updated.
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm text-slate-600 mb-1.5 block">
                Type <span className="font-mono font-semibold">RESET</span> to
                confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleReset}
                disabled={confirmText !== "RESET" || loading}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Confirm reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function AdminSettingsPage({
  onClose,
}: {
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showReset, setShowReset] = useState(false);

  const {
    data: settings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.getSettings(),
  });

  const { data: config } = useQuery({
    queryKey: ["app-config"],
    queryFn: () => api.getConfig(),
  });

  const handleResetSuccess = () => {
    setShowReset(false);
    queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    navigate("/documents");
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-8">
        <PageHeader
          icon={<Settings className="text-amber-500" size={28} />}
          title="Document Ingestion Settings"
          info="RAG configuration, storage consistency check, and admin actions."
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

      {isLoading && <p className="text-slate-400 text-sm">Loading…</p>}
      {isError && (
        <p className="text-red-500 text-sm">Failed to load configuration.</p>
      )}

      {settings && (
        <>
          <SectionCard title="Storage">
            <StorageSection settings={settings} />
          </SectionCard>

          {config && (
            <SectionCard title="Chunking">
              <ChunkingSection config={config} />
            </SectionCard>
          )}

          <SectionCard title="Embedding">
            <EmbeddingSection settings={settings} />
          </SectionCard>

          <SectionCard title="Storage Consistency">
            <ConsistencySection />
          </SectionCard>

          <SectionCard title="Danger Zone">
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <p className="text-sm text-red-700 mb-3">
                Permanently deletes all data — documents, chunks, conversations,
                and stored files.
              </p>
              <button
                onClick={() => setShowReset(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Trash2 size={15} />
                Reset all data and change settings
              </button>
            </div>
          </SectionCard>
        </>
      )}

      {showReset && settings && (
        <ResetDialog
          currentSettings={settings}
          config={config!}
          onClose={() => setShowReset(false)}
          onSuccess={handleResetSuccess}
        />
      )}
    </div>
  );
}
