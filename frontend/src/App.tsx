import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import AppLayout from "./components/layout/AppLayout";
import ChatInterface from "./components/chat/ChatInterface";
import DocumentList from "./components/documents/DocumentList";
import DocumentUpload from "./components/documents/DocumentUpload";
import DashboardPage from "./components/pages/DashboardPage";
import SettingsPage from "./components/pages/SettingsPage";
import TechnicalPage from "./components/pages/TechnicalPage";
import PageHeader from "./components/ui/PageHeader";
import { useCreateConversation } from "./hooks/useConversation";
import { FileText, MessageSquare } from "lucide-react";

const queryClient = new QueryClient();

function DocumentsPage() {
  return (
    <div className="p-8">
      <PageHeader
        icon={<FileText className="text-green-600" size={28} />}
        title="Documents"
        info="Gérez les documents indexés dans la base de connaissance. Chaque document est découpé en chunks, vectorisé et stocké pour la recherche sémantique."
      />
      <div className="space-y-6">
        <DocumentUpload />
        <DocumentList />
      </div>
    </div>
  );
}

function ConversationsPage() {
  const navigate = useNavigate();
  const createConversation = useCreateConversation();

  useEffect(() => {
    createConversation.mutateAsync().then((conv) => {
      navigate(`/conversations/${conv.id}`, { replace: true });
    });
  }, []);

  return (
    <div className="p-8">
      <PageHeader
        icon={<MessageSquare className="text-blue-500" size={28} />}
        title="Conversations"
        info="Posez des questions sur vos documents. Le système recherche les passages pertinents et génère une réponse contextuelle."
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="conversations" element={<ConversationsPage />} />
            <Route path="conversations/:id" element={<ChatInterface />} />
            <Route path="technical" element={<TechnicalPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
