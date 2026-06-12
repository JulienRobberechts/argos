import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  TrendingUp,
  Database,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../ui/PageHeader";
import { useDocuments } from "../../hooks/useDocuments";
import { useConversations } from "../../hooks/useConversation";
import { useConfig } from "../../hooks/useConfig";
import {
  StatCard,
  DocumentStatusBar,
  RecentDocuments,
  RecentConversations,
  RagConfigCard,
} from "./DashboardWidgets";

export default function DashboardPage() {
  const { data: documents = [], isLoading: docsLoading } = useDocuments();
  const { data: conversations = [], isLoading: convsLoading } =
    useConversations();
  const { data: config, isLoading: configLoading } = useConfig();

  const readyDocs = documents.filter((d) => d.status === "ready").length;
  const totalMessages = conversations.reduce(
    (sum, c) => sum + (c.messages?.length ?? 0),
    0,
  );

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        icon={<LayoutDashboard className="text-blue-600" size={28} />}
        title="Argos"
        info="Overview of the knowledge base: indexed documents, recent conversations and RAG system status."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Indexed documents"
          value={docsLoading ? "…" : readyDocs}
          icon={<FileText size={20} className="text-green-600" />}
          color="bg-green-50"
          sub={docsLoading ? undefined : `of ${documents.length} total`}
        />
        <StatCard
          label="Conversations"
          value={convsLoading ? "…" : conversations.length}
          icon={<MessageSquare size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Messages exchanged"
          value={convsLoading ? "…" : totalMessages}
          icon={<TrendingUp size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="RAG Pipeline"
          value={configLoading ? "…" : "Active"}
          icon={<Zap size={20} className="text-orange-500" />}
          color="bg-orange-50"
          sub={config ? config.rag.chunkingStrategy : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-green-500" />
              <h2 className="font-semibold text-gray-700 text-sm">
                Recent documents
              </h2>
            </div>
            <Link
              to="/documents"
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {docsLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : documents.length === 0 ? (
            <div className="text-center py-6">
              <FileText size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No documents</p>
              <Link
                to="/documents"
                className="mt-2 inline-block text-xs text-blue-500 hover:underline"
              >
                Import a document →
              </Link>
            </div>
          ) : (
            <>
              <DocumentStatusBar documents={documents} />
              <RecentDocuments documents={documents} />
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-500" />
              <h2 className="font-semibold text-gray-700 text-sm">
                Recent conversations
              </h2>
            </div>
            <Link
              to="/conversations"
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {convsLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : conversations.length === 0 ? (
            <div className="text-center py-6">
              <MessageSquare size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No conversations</p>
              <Link
                to="/conversations/new"
                className="mt-2 inline-block text-xs text-blue-500 hover:underline"
              >
                Start a conversation →
              </Link>
            </div>
          ) : (
            <RecentConversations conversations={conversations} />
          )}
        </div>
      </div>

      {config && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-orange-400" />
              <h2 className="font-semibold text-gray-700 text-sm">
                Active RAG configuration
              </h2>
            </div>
            <Link
              to="/settings"
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              Edit <ArrowRight size={12} />
            </Link>
          </div>
          <RagConfigCard config={config.rag} />
        </div>
      )}
    </div>
  );
}
