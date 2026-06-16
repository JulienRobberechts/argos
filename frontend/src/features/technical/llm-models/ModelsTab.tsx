import ModelCard from "./ModelCard";
import { MODELS } from "./models-data";

export default function ModelsTab() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {MODELS.map((m) => (
        <ModelCard key={m.id} model={m} />
      ))}
    </div>
  );
}
