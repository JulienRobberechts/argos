import { FlaskConical } from "lucide-react";

export default function TechnicalPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <FlaskConical className="text-purple-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">
          Explications techniques
        </h1>
      </div>
      <p className="text-gray-500">Documentation technique — à venir.</p>
    </div>
  );
}
