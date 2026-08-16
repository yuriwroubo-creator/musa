import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, MessageCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { toast } from "sonner";

export const Route = createFileRoute("/chat/$conversationId")({
  component: ChatPage,
});

type Conversation = {
  id: string;
  participant_a: string;
  participant_b: string;
  user_a?: {
    full_name?: string | null;
    avatar_url?: string | null;
    username?: string | null;
  } | null;
  user_b?: {
    full_name?: string | null;
    avatar_url?: string | null;
    username?: string | null;
  } | null;
};

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

  const conversation = useMemo(() => {
    return (conversations || []).find((entry: any) => entry.id === conversationId) as
      | Conversation
      | undefined;
  }, [conversations, conversationId]);

  const { otherUserName, otherAvatarUrl } = useMemo(() => {
    if (!conversation || !user) {
      return { otherUserName: "Conversa", otherAvatarUrl: "" };
    }

    const isUserA = conversation.participant_a === user.id;
    const otherUser = isUserA ? conversation.user_b : conversation.user_a;

    return {
      otherUserName:
        otherUser?.full_name || otherUser?.username || "Utilizador MUSA",
      otherAvatarUrl: otherUser?.avatar_url || "",
    };
  }, [conversation, user]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();

    const value = content.trim();
    if (!value) return;

    try {
      await sendMessage.mutateAsync(value);
      setContent("");
    } catch (err: any) {
      console.error("sendMessage error", err);
      toast.error("Erro ao enviar mensagem. Tenta novamente.");
    }
  };

  if (loading || isLoading) {
    return <ChatSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (!conversation && conversations) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0f0f10] px-4 text-white">
        <div className="max-w-md rounded-[28px] border border-white/10 bg-white/5 p-6 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/10">
            <MessageCircle className="size-7 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-black">Conversa indisponível</h2>
          <p className="mt-2 text-sm text-white/65">
            Esta conversa não foi encontrada. Podes voltar à inbox e abrir outra conversa.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/mensagens" })}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-white shadow-neon"
          >
            Voltar às mensagens
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0f0f10] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f0f10]/92 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/mensagens" })}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/8 text-white transition active:scale-95"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
              {otherAvatarUrl ? (
                <img src={otherAvatarUrl} alt={otherUserName} className="size-full object-cover" />
              ) : (
                <span className="text-sm font-black">{otherUserName.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-black leading-tight">{otherUserName}</h1>
              <p className="mt-0.5 text-[11px] text-white/55">Resposta rápida no Android e no iPhone</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 md:flex">
            <Sparkles className="size-4 text-primary" />
            Chat MUSA
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4 pb-6 lg:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          {messages.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center text-white/70 shadow-2xl backdrop-blur-sm">
              <MessageCircle className="mx-auto size-8 text-primary" />
              <p className="mt-3 text-sm">
                Ainda não há mensagens nesta conversa. Escreve a primeira para iniciares o chat.
              </p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMine = msg.sender_id === user.id;
              const timeLabel = msg.created_at
                ? new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[84%] rounded-[24px] px-4 py-3 shadow-sm ${
                      isMine
                        ? "rounded-br-md bg-gradient-to-br from-[#FF2D78] to-[#FF5BA3] text-white"
                        : "rounded-bl-md border border-white/10 bg-white/8 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
                      {msg.content}
                    </p>
                    <span
                      className={`mt-1 block text-[10px] font-medium ${
                        isMine ? "text-white/75" : "text-white/45"
                      }`}
                    >
                      {timeLabel}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-white/10 bg-[#0f0f10]/96 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:px-6"
      >
        <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-[0_14px_30px_rgba(0,0,0,.22)]">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={`Mensagem para ${otherUserName}...`}
            rows={1}
            enterKeyHint="send"
            autoCapitalize="sentences"
            className="flex-1 resize-none bg-transparent px-1 py-2 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/35 max-h-32"
          />
          <button
            type="submit"
            disabled={!content.trim() || sendMessage.isPending}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary px-4 text-sm font-bold text-white shadow-neon transition active:scale-95 disabled:opacity-50"
          >
            {sendMessage.isPending ? (
              <span className="text-[12px] font-bold">...</span>
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0f0f10] text-white">
      <div className="sticky top-0 border-b border-white/10 bg-[#0f0f10]/92 px-4 py-3 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <div className="size-11 animate-pulse rounded-full bg-white/10" />
          <div className="flex-1">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 lg:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={`flex ${index % 2 === 0 ? "justify-end" : "justify-start"}`}
            >
              <div className="h-14 w-40 animate-pulse rounded-[24px] bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0f0f10]/96 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6">
        <div className="mx-auto h-[76px] w-full max-w-4xl animate-pulse rounded-[28px] bg-white/10" />
      </div>
    </div>
  );
}
