import { FileText, Settings2 } from "lucide-react";
import { useMatch, useNavigate } from "react-router-dom";
import { useDocuments } from "../../hooks/useDocuments";
import PageHeader from "../ui/PageHeader";
import DocumentStatusBadge from "./DocumentStatusBadge";
import DocumentTypeIcon from "./DocumentTypeIcon";
import DocumentUpload from "./DocumentUpload";

export default function DocumentsSidebar({
  showSettings,
  onToggleSettings,
}: {
  showSettings?: boolean;
  onToggleSettings?: () => void;
}) {
  const navigate = useNavigate();
  const match = useMatch("/documents/:id");
  const activeId = match?.params.id;

  const { data: documents } = useDocuments();

  return (
    <div className="flex flex-col h-full p-4">
      <PageHeader
        icon={<FileText className="text-[#d97706]" size={28} />}
        title="Documents"
        info="Manage documents indexed in the knowledge base. Each document is split into chunks, vectorized and stored for semantic search."
      />
      <div className="mb-4">
        <DocumentUpload
          onUploaded={(doc) => navigate(`/documents/${doc.id}`)}
        />
      </div>
      <nav className="flex flex-col gap-1 overflow-y-auto flex-1">
        {documents?.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => navigate(`/documents/${doc.id}`)}
            className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer text-left ${
              activeId === doc.id
                ? "bg-amber-50 text-[#92400e] font-medium border border-amber-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <DocumentTypeIcon sourceType={doc.sourceType} />
              <span className="truncate">{doc.title}</span>
              <DocumentStatusBadge status={doc.status} />
            </div>
          </button>
        ))}
        {!documents?.length && (
          <p className="text-xs text-slate-400 px-3 py-2">No documents yet.</p>
        )}
      </nav>
      {onToggleSettings && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onToggleSettings}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
              showSettings
                ? "bg-amber-50 text-[#92400e] border border-amber-200 font-medium"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Settings2 size={14} />
            Settings
          </button>
        </div>
      )}
    </div>
  );
}
