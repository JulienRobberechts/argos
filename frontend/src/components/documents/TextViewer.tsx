import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export default function TextViewer({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["documents", id, "content"],
    queryFn: () => api.getDocumentContent(id),
  });

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8">
      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {data && (
        <pre className="max-w-3xl mx-auto text-sm text-slate-800 font-mono whitespace-pre-wrap break-words leading-relaxed bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          {data.content}
        </pre>
      )}
    </div>
  );
}
