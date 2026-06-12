export default function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  activeTextColor = "text-purple-700",
}: {
  tabs: readonly T[];
  active: T;
  onChange: (t: T) => void;
  activeTextColor?: string;
}) {
  return (
    <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            active === t
              ? `bg-white ${activeTextColor} shadow-sm`
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
