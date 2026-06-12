import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export default function TextViewer({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["documents", id, "content"],
    queryFn: () => api.getDocumentContent(id),
  });

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {data && (
        <pre className="max-w-3xl mx-auto text-sm text-gray-800 font-mono whitespace-pre-wrap break-words leading-relaxed bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {data.content}
        </pre>
      )}
    </div>
  );
}
