export default function PipelineStep({
  step,
  icon,
  title,
  description,
  isLast = false,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          {step}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-purple-200 mt-2 min-h-[2rem]" />
        )}
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-purple-600">{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
