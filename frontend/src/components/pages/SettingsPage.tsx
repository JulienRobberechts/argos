import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-gray-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
      </div>
      <p className="text-gray-500">Configuration — à venir.</p>
    </div>
  );
}
