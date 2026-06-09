import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="text-blue-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">Argos</h1>
      </div>
      <p className="text-gray-500">Tableau de bord — à venir.</p>
    </div>
  );
}
