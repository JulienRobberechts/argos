const COLORS = {
  purple: "bg-purple-100 text-purple-700",
  teal: "bg-teal-100 text-teal-700",
  blue: "bg-blue-100 text-blue-700",
};

export default function SectionTitle({
  icon,
  title,
  subtitle,
  accentColor = "purple",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accentColor?: "purple" | "teal" | "blue";
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${COLORS[accentColor]}`}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
