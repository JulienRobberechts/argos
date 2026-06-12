export default function StrategyBadge({
  label,
  color,
}: {
  label: string;
  color: "teal" | "purple" | "blue";
}) {
  const colors = {
    teal: "bg-teal-100 text-teal-800 border-teal-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <span
      className={`inline-block border rounded-full px-3 py-0.5 text-xs font-semibold ${colors[color]}`}
    >
      {label}
    </span>
  );
}
