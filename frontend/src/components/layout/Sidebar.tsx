import { Link, useMatch, useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from "../../hooks/useConversation";
import PageHeader from "../ui/PageHeader";

export default function Sidebar() {
  const navigate = useNavigate();
  const match = useMatch("/conversations/:id");
  const activeId = match?.params.id;

  const { data: conversations } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  async function handleNew() {
    const conv = await createConversation.mutateAsync();
    navigate(`/conversations/${conv.id}`);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    await deleteConversation.mutateAsync(id);
    if (activeId === id) navigate("/conversations");
  }

  return (
    <div className="flex flex-col h-full p-4">
      <PageHeader
        icon={<MessageSquare className="text-blue-500" size={28} />}
        title="Conversations"
        info="Posez des questions sur vos documents. Le système recherche les passages pertinents et génère une réponse contextuelle."
      />
      <button
        onClick={() => void handleNew()}
        disabled={createConversation.isPending}
        className="w-full mb-4 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        + Nouvelle conversation
      </button>
      <nav className="flex flex-col gap-1 overflow-y-auto flex-1">
        {conversations?.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm ${
              activeId === conv.id
                ? "bg-blue-100 text-blue-800 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Link to={`/conversations/${conv.id}`} className="flex-1 truncate">
              {conv.title}
            </Link>
            <button
              onClick={(e) => void handleDelete(e, conv.id)}
              className="hidden group-hover:block ml-2 text-gray-400 hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
      </nav>
    </div>
  );
}
