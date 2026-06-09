import { LayoutDashboard } from "lucide-react";
import PageHeader from "../ui/PageHeader";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <PageHeader
        icon={<LayoutDashboard className="text-blue-600" size={28} />}
        title="Argos"
        info="Vue d'ensemble de la base de connaissance : documents indexés, conversations récentes et état du système RAG."
      />
      <p className="text-gray-500">Tableau de bord — à venir.</p>
    </div>
  );
}
