import type { SourceCitation } from "../../types/domain";
import DocumentTypeIcon from "../documents/DocumentTypeIcon";

export default function SourceCard({ source }: { source: SourceCitation }) {
  return (
    <div className="flex gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
      <DocumentTypeIcon sourceType={source.sourceType} size={14} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-medium text-gray-700 truncate">
            {source.documentTitle}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {(source.score * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
          {source.excerpt}
        </p>
      </div>
    </div>
  );
}
