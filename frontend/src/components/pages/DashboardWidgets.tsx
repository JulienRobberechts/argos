import {
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Document, Conversation } from "../../types/domain";

export function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function DocumentStatusBar({ documents }: { documents: Document[] }) {
  const ready = documents.filter((d) => d.status === "ready").length;
  const processing = documents.filter((d) => d.status === "processing").length;
  const pending = documents.filter((d) => d.status === "pending").length;
  const error = documents.filter((d) => d.status === "error").length;
  const total = documents.length;

  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
        {ready > 0 && (
          <div
            className="bg-green-400 transition-all"
            style={{ width: `${(ready / total) * 100}%` }}
          />
        )}
        {processing > 0 && (
          <div
            className="bg-blue-400 animate-pulse"
            style={{ width: `${(processing / total) * 100}%` }}
          />
        )}
        {pending > 0 && (
          <div
            className="bg-yellow-300"
            style={{ width: `${(pending / total) * 100}%` }}
          />
        )}
        {error > 0 && (
          <div
            className="bg-red-400"
            style={{ width: `${(error / total) * 100}%` }}
          />
        )}
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        {ready > 0 && (
          <span className="flex items-center gap-1">
            <CheckCircle size={11} className="text-green-500" />
            {ready} ready
          </span>
        )}
        {processing > 0 && (
          <span className="flex items-center gap-1">
            <Loader2 size={11} className="text-blue-500 animate-spin" />
            {processing} processing
          </span>
        )}
        {pending > 0 && (
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-yellow-500" />
            {pending} pending
          </span>
        )}
        {error > 0 && (
          <span className="flex items-center gap-1">
            <AlertCircle size={11} className="text-red-500" />
            {error} error{error > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

export function RecentDocuments({ documents }: { documents: Document[] }) {
  const recent = [...documents]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const statusIcon = {
    ready: <CheckCircle size={14} className="text-green-500 shrink-0" />,
    processing: (
      <Loader2 size={14} className="text-blue-500 animate-spin shrink-0" />
    ),
    pending: <Clock size={14} className="text-yellow-500 shrink-0" />,
    error: <AlertCircle size={14} className="text-red-500 shrink-0" />,
  };
  const typeLabel: Record<string, string> = {
    pdf: "PDF",
    markdown: "MD",
    text: "TXT",
  };

  return (
    <div className="space-y-2">
      {recent.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {statusIcon[doc.status]}
          <span className="flex-1 text-sm text-gray-700 truncate">
            {doc.title}
          </span>
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
            {typeLabel[doc.sourceType] ?? doc.sourceType}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RecentConversations({
  conversations,
}: {
  conversations: Conversation[];
}) {
  const recent = [...conversations]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-2">
      {recent.map((conv) => {
        const msgCount = conv.messages?.length ?? 0;
        return (
          <Link
            key={conv.id}
            to={`/conversations/${conv.id}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <MessageSquare size={14} className="text-blue-400 shrink-0" />
            <span className="flex-1 text-sm text-gray-700 truncate group-hover:text-blue-700">
              {conv.title}
            </span>
            <span className="text-xs text-gray-400">
              {msgCount} msg{msgCount > 1 ? "s" : ""}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function RagConfigCard({
  config,
}: {
  config: {
    chunkSize: number;
    chunkOverlap: number;
    retrievalLimit: number;
    retrievalMinScore: number;
    reranking: { enabled: boolean; model: string };
  };
}) {
  const items = [
    { label: "Chunk size", value: `${config.chunkSize} tokens` },
    { label: "Overlap", value: `${config.chunkOverlap} tokens` },
    { label: "Results retrieved", value: config.retrievalLimit },
    { label: "Minimum score", value: config.retrievalMinScore.toFixed(2) },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-semibold text-gray-700">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
        <span
          className={`inline-block w-2 h-2 rounded-full ${config.reranking.enabled ? "bg-green-400" : "bg-gray-300"}`}
        />
        <span className="text-xs text-gray-400">Reranking</span>
        <span className="text-sm font-semibold text-gray-700 ml-auto">
          {config.reranking.enabled ? "active" : "disabled"}
        </span>
      </div>
    </div>
  );
}
