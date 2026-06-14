import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import type {
  AppSettings,
  AppSettingsPatch,
  ConsistencyReport,
} from "../../types/domain";
import PageHeader from "../../components/ui/PageHeader";

// ─── RAG Config Section ──────────────────────────────────────────────────────

function Collapsible({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-200 rounded-lg mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
      >
        {title}
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
    />
  );
}

interface FormStorage {
  provider: string;
  bucketName: string;
  endpoint: string;
}
interface FormEmbedding {
  provider: string;
  model: string;
  apiKey: string;
}
interface FormLLM {
  provider: string;
  model: string;
  apiKey: string;
}

interface RagFormState {
  storage: FormStorage;
  embedding: FormEmbedding;
  llm: FormLLM;
}

function buildInitialForm(settings: AppSettings): RagFormState {
  return {
    storage: {
      provider: settings.storage.provider,
      bucketName: settings.storage.bucketName,
      endpoint: settings.storage.endpoint,
    },
    embedding: {
      provider: settings.embedding.provider,
      model: settings.embedding.model,
      apiKey: "",
    },
    llm: {
      provider: settings.llm.provider,
      model: settings.llm.model,
      apiKey: "",
    },
  };
}

function RagConfigSection({ settings }: { settings: AppSettings }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RagFormState>(() =>
    buildInitialForm(settings),
  );
  const [toast, setToast] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const patch: AppSettingsPatch = {
        storage: form.storage,
        embedding: {
          provider: form.embedding.provider,
          model: form.embedding.model,
          ...(form.embedding.apiKey ? { apiKey: form.embedding.apiKey } : {}),
        },
        llm: {
          provider: form.llm.provider,
          model: form.llm.model,
          ...(form.llm.apiKey ? { apiKey: form.llm.apiKey } : {}),
        },
      };
      return api.updateSettings(patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setToast("Configuration mise à jour");
      setTimeout(() => setToast(null), 3000);
    },
  });

  const setStorage = (key: string, value: string) =>
    setForm((f) => ({ ...f, storage: { ...f.storage, [key]: value } }));
  const setEmbedding = (key: string, value: string) =>
    setForm((f) => ({ ...f, embedding: { ...f.embedding, [key]: value } }));
  const setLlm = (key: string, value: string) =>
    setForm((f) => ({ ...f, llm: { ...f.llm, [key]: value } }));

  return (
    <div>
      <Collapsible title="Stockage">
        <Field label="Provider">
          <Select
            value={form.storage.provider}
            options={["r2", "s3", "local"]}
            onChange={(v) => setStorage("provider", v)}
          />
        </Field>
        <Field label="Bucket name">
          <Input
            value={form.storage.bucketName}
            onChange={(v) => setStorage("bucketName", v)}
          />
        </Field>
        <Field label="Endpoint URL">
          <Input
            value={form.storage.endpoint}
            onChange={(v) => setStorage("endpoint", v)}
          />
        </Field>
      </Collapsible>

      <Collapsible title="Embedding">
        <Field label="Provider">
          <Select
            value={form.embedding.provider}
            options={["openai", "mistral", "voyage"]}
            onChange={(v) => setEmbedding("provider", v)}
          />
        </Field>
        <Field label="Modèle">
          <Input
            value={form.embedding.model}
            onChange={(v) => setEmbedding("model", v)}
          />
        </Field>
        <Field label="Clé API">
          <Input
            type="password"
            value={form.embedding.apiKey}
            onChange={(v) => setEmbedding("apiKey", v)}
            placeholder={
              settings.embedding.apiKeySet ? "••••••• (défini)" : "Non défini"
            }
          />
        </Field>
      </Collapsible>

      <Collapsible title="LLM">
        <Field label="Provider">
          <Select
            value={form.llm.provider}
            options={["anthropic", "openai"]}
            onChange={(v) => setLlm("provider", v)}
          />
        </Field>
        <Field label="Modèle">
          <Input value={form.llm.model} onChange={(v) => setLlm("model", v)} />
        </Field>
        <Field label="Clé API">
          <Input
            type="password"
            value={form.llm.apiKey}
            onChange={(v) => setLlm("apiKey", v)}
            placeholder={
              settings.llm.apiKeySet ? "••••••• (défini)" : "Non défini"
            }
          />
        </Field>
      </Collapsible>

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
        {mutation.isPending
          ? "Enregistrement…"
          : "Enregistrer la configuration"}
      </button>
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
      const result = await api.checkStorageConsistency();
      setReport(result);
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
        {loading
          ? "Vérification en cours…"
          : "Vérifier la cohérence BDD ↔ Stockage"}
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
              Base et stockage cohérents
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle size={16} />
                Incohérences détectées
              </div>
              {report.orphanFiles.length > 0 && (
                <div>
                  <p className="font-medium text-xs uppercase tracking-wide mb-1">
                    Fichiers orphelins (stockage sans BDD)
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
                    Fichiers manquants (BDD sans stockage)
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
  const [form, setForm] = useState<RagFormState>(() =>
    buildInitialForm(currentSettings),
  );
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const setStorage = (key: string, value: string) =>
    setForm((f) => ({ ...f, storage: { ...f.storage, [key]: value } }));
  const setEmbedding = (key: string, value: string) =>
    setForm((f) => ({ ...f, embedding: { ...f.embedding, [key]: value } }));
  const setLlm = (key: string, value: string) =>
    setForm((f) => ({ ...f, llm: { ...f.llm, [key]: value } }));

  const buildNewSettings = (): AppSettingsPatch | undefined => {
    if (!changeConfig) return undefined;
    return {
      storage: form.storage,
      embedding: {
        provider: form.embedding.provider,
        model: form.embedding.model,
        ...(form.embedding.apiKey ? { apiKey: form.embedding.apiKey } : {}),
      },
      llm: {
        provider: form.llm.provider,
        model: form.llm.model,
        ...(form.llm.apiKey ? { apiKey: form.llm.apiKey } : {}),
      },
    };
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.resetAll(buildNewSettings());
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
              Voulez-vous changer la configuration avant le reset ?
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Optionnel — vous pouvez réinitialiser sans changer la
              configuration.
            </p>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={changeConfig}
                onChange={(e) => setChangeConfig(e.target.checked)}
                className="accent-amber-500"
              />
              <span className="text-sm text-slate-700">
                Modifier la configuration RAG
              </span>
            </label>

            {changeConfig && (
              <div className="mb-4 max-h-64 overflow-y-auto">
                <Collapsible title="Stockage">
                  <Field label="Provider">
                    <Select
                      value={form.storage.provider}
                      options={["r2", "s3", "local"]}
                      onChange={(v) => setStorage("provider", v)}
                    />
                  </Field>
                  <Field label="Bucket name">
                    <Input
                      value={form.storage.bucketName}
                      onChange={(v) => setStorage("bucketName", v)}
                    />
                  </Field>
                  <Field label="Endpoint URL">
                    <Input
                      value={form.storage.endpoint}
                      onChange={(v) => setStorage("endpoint", v)}
                    />
                  </Field>
                </Collapsible>
                <Collapsible title="Embedding">
                  <Field label="Provider">
                    <Select
                      value={form.embedding.provider}
                      options={["openai", "mistral", "voyage"]}
                      onChange={(v) => setEmbedding("provider", v)}
                    />
                  </Field>
                  <Field label="Modèle">
                    <Input
                      value={form.embedding.model}
                      onChange={(v) => setEmbedding("model", v)}
                    />
                  </Field>
                  <Field label="Clé API">
                    <Input
                      type="password"
                      value={form.embedding.apiKey}
                      onChange={(v) => setEmbedding("apiKey", v)}
                      placeholder={
                        currentSettings.embedding.apiKeySet
                          ? "••••••• (défini)"
                          : "Non défini"
                      }
                    />
                  </Field>
                </Collapsible>
                <Collapsible title="LLM">
                  <Field label="Provider">
                    <Select
                      value={form.llm.provider}
                      options={["anthropic", "openai"]}
                      onChange={(v) => setLlm("provider", v)}
                    />
                  </Field>
                  <Field label="Modèle">
                    <Input
                      value={form.llm.model}
                      onChange={(v) => setLlm("model", v)}
                    />
                  </Field>
                  <Field label="Clé API">
                    <Input
                      type="password"
                      value={form.llm.apiKey}
                      onChange={(v) => setLlm("apiKey", v)}
                      placeholder={
                        currentSettings.llm.apiKeySet
                          ? "••••••• (défini)"
                          : "Non défini"
                      }
                    />
                  </Field>
                </Collapsible>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm bg-slate-700 text-white hover:bg-slate-800 rounded-md transition-colors"
              >
                Suivant
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
                Cette action est irréversible. Toutes les données (documents,
                conversations, fichiers) seront supprimées définitivement.
              </p>
            </div>

            {changeConfig && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                La configuration sera également mise à jour.
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm text-slate-600 mb-1.5 block">
                Saisissez <span className="font-mono font-semibold">RESET</span>{" "}
                pour confirmer
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
                Retour
              </button>
              <button
                onClick={handleReset}
                disabled={confirmText !== "RESET" || loading}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Confirmer la réinitialisation
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
          info="Configuration RAG, vérification de cohérence et actions d'administration."
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

      {isLoading && <p className="text-slate-400 text-sm">Chargement…</p>}
      {isError && (
        <p className="text-red-500 text-sm">
          Impossible de charger la configuration.
        </p>
      )}

      {settings && (
        <>
          <SectionCard title="Configuration RAG">
            <RagConfigSection settings={settings} />
          </SectionCard>

          <SectionCard title="Vérification de cohérence">
            <ConsistencySection />
          </SectionCard>

          <SectionCard title="Danger Zone">
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <p className="text-sm text-red-700 mb-3">
                Supprime toutes les données (documents, chunks, conversations,
                fichiers stockés) de manière irréversible.
              </p>
              <button
                onClick={() => setShowReset(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Réinitialiser toutes les données
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
