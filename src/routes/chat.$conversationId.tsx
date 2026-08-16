import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { toast } from "sonner";

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await sendMessage.mutateAsync(content.trim());
      setContent("");
    } catch (err: any) {
      console.error("sendMessage error", err);
      toast.error("Erro ao enviar mensagem. Tenta novamente.");
    }
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
      <form onSubmit={handleSend} className="p-3 border-t shrink-0 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreve uma mensagem..."
            rows={1}
            className="flex-1 resize-none px-4 py-2 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-black max-h-40"
          />
          <button
            type="submit"
            disabled={!content.trim() || sendMessage.isPending}
            className="bg-black text-white px-4 py-2 rounded-full font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {sendMessage.isPending ? "A enviar..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}
