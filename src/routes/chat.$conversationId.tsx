import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";

export const Route = createFileRoute("/chat/$conversationId")({
  component: ChatPage,
});

function ChatPage() {
  const { conversationId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const { messages, isLoading, sendMessage } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading || isLoading) {
    return <div className="p-4">A carregar chat...</div>;
  }

  if (!user) {
    return null;
  }

  const conversation = conversations?.find((c: any) => c.id === conversationId);
  let otherUserName = "Chat";
  if (conversation) {
    const isUserA = conversation.participant_a === user.id;
    const otherUser = isUserA ? conversation.user_b : conversation.user_a;
    otherUserName = otherUser?.full_name || otherUser?.name || otherUser?.raw_user_meta_data?.name || "Utilizador MUSA";
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage.mutate(content);
    setContent("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto w-full border-x bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center bg-gray-50 shrink-0">
        <button 
          onClick={() => navigate({ to: "/mensagens" })}
          className="mr-4 text-gray-500 hover:text-gray-800"
        >
          &larr; Voltar
        </button>
        <h2 className="text-xl font-semibold">{otherUserName}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg: any) => {
          const isMine = msg.sender_id === user.id;
          return (
            <div
              key={msg.id}
              className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                isMine 
                  ? "bg-black text-white self-end rounded-br-sm" 
                  : "bg-gray-100 text-black self-start rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <span className={`text-[10px] block mt-1 ${isMine ? "text-gray-300" : "text-gray-500"}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t flex gap-2 shrink-0 bg-white">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          disabled={!content.trim() || sendMessage.isPending}
          className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
