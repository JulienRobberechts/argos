import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, AlertTriangle, CheckCircle, X, Lock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import type {
  AppSettings,
  AppSettingsPatch,
  ConsistencyReport,
} from "../../types/domain";
import { useDocuments } from "../../hooks/useDocuments";
import { useConversations } from "../../hooks/useConversation";
import PageHeader from "../../components/ui/PageHeader";

// ─── Config Form ──────────────────────────────────────────────────────────────

function ProviderSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; available: boolean }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
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
}

function buildForm(settings: AppSettings): FormState {
  return {
    embeddingProvider: settings.embedding.provider,
    storageProvider: settings.storage.provider,
  };
}

function ConfigForm({
  settings,
  form,
  onChange,
  disabled,
}: {
  settings: AppSettings;
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <ProviderSelect
        label="Document Storage"
        value={form.storageProvider}
        options={settings.storage.options.map((o) => ({
          value: o.provider,
          label: o.label,
          available: o.available,
        }))}
        onChange={(v) => onChange({ storageProvider: v })}
        disabled={disabled}
      />
      <ProviderSelect
        label="RAG Embedding"
        value={form.embeddingProvider}
        options={settings.embedding.options.map((o) => ({
          value: o.provider,
          label: o.label,
          available: o.available,
        }))}
        onChange={(v) => onChange({ embeddingProvider: v })}
        disabled={disabled}
      />
    </div>
  );
}

// ─── RAG Config Section ───────────────────────────────────────────────────────

function RagConfigSection({
  settings,
  readonly,
}: {
  settings: AppSettings;
  readonly: boolean;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => buildForm(settings));
  const [toast, setToast] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const patch: AppSettingsPatch = {
        embedding: { provider: form.embeddingProvider },
        storage: { provider: form.storageProvider },
      };
      return api.updateSettings(patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setToast("Settings saved");
      setTimeout(() => setToast(null), 3000);
    },
  });

  return (
    <div>
      {readonly && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-500 text-xs">
          <Lock size={13} />
          Read-only — delete all documents and conversations to edit these
          settings.
        </div>
      )}

      <ConfigForm
        settings={settings}
        form={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        disabled={readonly}
      />

      {!readonly && (
        <div className="mt-4">
          {toast && (
            <div className="mb-3 px-3 py-2 rounded-md bg-green-50 text-green-700 text-sm border border-green-200">
              {toast}
            </div>
          )}
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
          >
            {mutation.isPending ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}
    </div>
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
        className="px-4 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
      >
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
  onClose,
  onSuccess,
}: {
  currentSettings: AppSettings;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [changeConfig, setChangeConfig] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildForm(currentSettings));
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      const newSettings: AppSettingsPatch | undefined = changeConfig
        ? {
            embedding: { provider: form.embeddingProvider },
            storage: { provider: form.storageProvider },
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">
              Update configuration before reset?
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Optional — you can reset without changing the configuration.
            </p>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={changeConfig}
                onChange={(e) => setChangeConfig(e.target.checked)}
                className="accent-amber-500"
              />
              <span className="text-sm text-slate-700">
                Change configuration
              </span>
            </label>

            {changeConfig && (
              <div className="mb-4">
                <ConfigForm
                  settings={currentSettings}
                  form={form}
                  onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                />
              </div>
            )}

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

  const { data: documents } = useDocuments();
  const { data: conversations } = useConversations();

  const hasData =
    (documents && documents.length > 0) ||
    (conversations && conversations.length > 0);

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
          <SectionCard title="RAG Configuration">
            <RagConfigSection settings={settings} readonly={!!hasData} />
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Reset all data and change settings
              </button>
            </div>
          </SectionCard>
        </>
      )}

      {showReset && settings && (
        <ResetDialog
          currentSettings={settings}
          onClose={() => setShowReset(false)}
          onSuccess={handleResetSuccess}
        />
      )}
    </div>
  );
}
