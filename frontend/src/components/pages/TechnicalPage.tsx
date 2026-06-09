import { FlaskConical } from "lucide-react";
import PageHeader from "../ui/PageHeader";

export default function TechnicalPage() {
  return (
    <div className="p-8">
      <PageHeader
        icon={<FlaskConical className="text-purple-600" size={28} />}
        title="Explications techniques"
        info="Documentation sur le fonctionnement interne du pipeline RAG : stratégies de découpage, modèles d'embeddings, recherche vectorielle et génération de réponses."
      />
      <p className="text-gray-500">Documentation technique — à venir.</p>
    </div>
  );
}
