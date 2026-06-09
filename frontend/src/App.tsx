import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ChatInterface from "./components/chat/ChatInterface";
import DocumentList from "./components/documents/DocumentList";
import DocumentUpload from "./components/documents/DocumentUpload";
import DashboardPage from "./components/pages/DashboardPage";
import SettingsPage from "./components/pages/SettingsPage";
import TechnicalPage from "./components/pages/TechnicalPage";
import PageHeader from "./components/ui/PageHeader";
import { FileText } from "lucide-react";

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
  return (
    <div className="p-8 text-gray-500">
      Sélectionnez ou créez une conversation.
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
