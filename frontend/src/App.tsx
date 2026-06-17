import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LoginScreen from "./components/auth/LoginScreen";
import ChatInterface from "./components/chat/ChatInterface";
import DocumentDetail from "./components/documents/DocumentDetail";
import DocumentUpload from "./components/documents/DocumentUpload";
import AppLayout from "./components/layout/AppLayout";
import ColorPalettePage from "./components/pages/ColorPalettePage";
import DashboardPage from "./components/pages/DashboardPage";
import FontPreviewPage from "./components/pages/FontPreviewPage";
import QuizPage from "./components/pages/QuizPage";
import PageHeader from "./components/ui/PageHeader";
import EvaluationPage from "./features/technical/EvaluationPage";
import HybridSearchPage from "./features/technical/HybridSearchPage";
import KnowledgeCheckPage from "./features/technical/KnowledgeCheckPage";
import LLMModelsPage from "./features/technical/LLMModelsPage";
import RerankingPage from "./features/technical/RerankingPage";
import TechnicalLayout from "./features/technical/TechnicalLayout";
import TechnicalPage from "./features/technical/TechnicalPage";
import { useConversations } from "./hooks/useConversation";
import { api, setOnUnauthorized } from "./services/api";

const queryClient = new QueryClient();

function DocumentsEmptyPage() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <DocumentUpload />
    </div>
  );
}

function ConversationsPage() {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();
  const hasActed = useRef(false);

  useEffect(() => {
    if (isLoading || hasActed.current) return;
    hasActed.current = true;
    if (conversations && conversations.length > 0) {
      navigate(`/conversations/${conversations[0].id}`, { replace: true });
    } else if (conversations) {
      navigate("/conversations/new", { replace: true });
    }
  }, [isLoading, navigate, conversations]);

  return (
    <div className="p-8">
      <PageHeader
        icon={<MessageSquare className="text-amber-500" size={28} />}
        title="Conversations"
        info="Ask questions about your documents. The system retrieves relevant passages and generates a contextual answer."
      />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setOnUnauthorized(() => setIsAuthenticated(false));
    api.checkAuth().then(setIsAuthenticated);
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50" />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="documents" element={<DocumentsEmptyPage />} />
            <Route path="documents/:id" element={<DocumentDetail />} />
            <Route path="conversations" element={<ConversationsPage />} />
            <Route path="conversations/new" element={<ChatInterface />} />
            <Route path="conversations/:id" element={<ChatInterface />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="technical" element={<TechnicalLayout />}>
              <Route index element={<TechnicalPage />} />
              <Route path="hybrid-search" element={<HybridSearchPage />} />
              <Route path="reranking" element={<RerankingPage />} />
              <Route path="llm-models" element={<LLMModelsPage />} />
              <Route path="knowledge-check" element={<KnowledgeCheckPage />} />
              <Route path="evaluation" element={<EvaluationPage />} />
            </Route>
            <Route path="font-preview" element={<FontPreviewPage />} />
            <Route path="color-palette" element={<ColorPalettePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
