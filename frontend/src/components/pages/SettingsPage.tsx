import { Info, Settings } from "lucide-react";
import { useState } from "react";
import { useConfig } from "../../hooks/useConfig";
import PageHeader from "../ui/PageHeader";

function Row({
  label,
  value,
  info,
}: {
  label: string;
  value: string | number;
  info: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-600">{label}</span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-gray-300 hover:text-blue-500 transition-colors"
            aria-label={`Explication : ${label}`}
          >
            <Info size={13} />
          </button>
        </div>
        <span className="text-sm font-mono text-gray-900">{value}</span>
      </div>
      {open && (
        <p className="mt-1 text-xs text-gray-500 bg-blue-50 rounded px-2 py-1">
          {info}
        </p>
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
    <div className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
        {title}
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg px-4">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: config, isLoading, isError } = useConfig();

  return (
    <div className="p-8 max-w-xl">
      <PageHeader
        icon={<Settings className="text-gray-600" size={28} />}
        title="Paramètres"
        info="Configuration du système Argos. Ces valeurs sont définies côté serveur via les variables d'environnement et affichées ici en lecture seule."
      />

      {isLoading && <p className="text-gray-400 text-sm">Chargement…</p>}
      {isError && (
        <p className="text-red-500 text-sm">
          Erreur de chargement de la configuration.
        </p>
      )}

      {config && (
        <>
          <Section title="Général">
            <Row
              label="Log level"
              value={config.logLevel}
              info="Verbosité des logs serveur. Valeurs possibles : debug, info, warn, error."
            />
          </Section>

          <Section title="RAG — Découpage">
            <Row
              label="Stratégie"
              value={config.rag.chunkingStrategy}
              info="Méthode de découpage des documents. « sentence » respecte les frontières de phrases ; « recursive » découpe par blocs de taille fixe."
            />
            <Row
              label="Taille chunk (tokens)"
              value={config.rag.chunkSize}
              info="Nombre maximum de tokens par chunk. Un chunk plus grand contient plus de contexte mais peut diluer la pertinence lors du retrieval."
            />
            <Row
              label="Chevauchement (tokens)"
              value={config.rag.chunkOverlap}
              info="Nombre de tokens partagés entre deux chunks consécutifs. Évite de couper une idée à cheval sur deux chunks."
            />
          </Section>

          <Section title="RAG — Retrieval">
            <Row
              label="Limite de résultats"
              value={config.rag.retrievalLimit}
              info="Nombre maximum de chunks renvoyés par la recherche vectorielle et injectés dans le contexte du LLM."
            />
            <Row
              label="Score minimum"
              value={config.rag.retrievalMinScore}
              info="Seuil de similarité cosinus (0–1) en-dessous duquel un chunk est ignoré. Un score élevé filtre les résultats peu pertinents."
            />
          </Section>

          <Section title="LLM">
            <Row
              label="Max tokens"
              value={config.llm.maxTokens}
              info="Nombre maximum de tokens que le LLM peut générer en réponse. Augmenter cette valeur permet des réponses plus longues."
            />
            <Row
              label="Température"
              value={config.llm.temperature}
              info="Contrôle la créativité des réponses (0 = déterministe, 1 = très créatif). Une valeur basse est recommandée pour des réponses factuelles."
            />
          </Section>
        </>
      )}
    </div>
  );
}
