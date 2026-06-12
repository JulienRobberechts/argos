const STYLES = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  tip: "bg-green-50 border-green-200 text-green-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
};

const LABELS = { info: "Note", tip: "Tip", warning: "Important" };

export default function Callout({
  type,
  children,
}: {
  type: "info" | "tip" | "warning";
  children: React.ReactNode;
}) {
  return (
    <div className={`border rounded-lg p-4 text-sm ${STYLES[type]}`}>
      <span className="font-semibold">{LABELS[type]}: </span>
      {children}
    </div>
  );
}
