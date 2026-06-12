import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { api } from "../../services/api";

export default function MarkdownViewer({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["documents", id, "content"],
    queryFn: () => api.getDocumentContent(id),
  });

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {data && (
        <div className="prose prose-sm max-w-3xl mx-auto bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <ReactMarkdown>{data.content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
