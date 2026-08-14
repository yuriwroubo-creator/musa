import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { musaAssistantFn } from "@/lib/musa-ai.functions";
import { cn } from "@/lib/utils";
import { getTasteProfile } from "@/lib/personalization";
import { useAuth } from "@/hooks/useAuth";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export function MusaAiFab() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Olá, sou a Musa AI. Posso ajudar-te a descobrir produtos, serviços e criadoras na MUSA.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const tasteProfile = getTasteProfile();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await musaAssistantFn({
        data: {
          message,
          context: {
            route: typeof window !== "undefined" ? window.location.pathname : "",
            userRole: user ? "creator" : "guest",
            preferredCategories: tasteProfile.categories,
          },
        },
      });
      return response;
    },
    onSuccess: (data) => {
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    },
    onError: () => {
      toast.error("A Musa AI não respondeu agora. Tenta outra vez.");
    },
  });

  const sendMessage = () => {
    const value = input.trim();
    if (!value || mutation.isPending) return;
    setMessages((current) => [...current, { role: "user", content: value }]);
    setInput("");
    mutation.mutate(value);
  };

  return (
    <>
      <button
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "fixed bottom-[92px] right-4 z-[90] flex items-center gap-2 rounded-full border border-white/12 bg-[linear-gradient(135deg,rgba(255,45,120,.98),rgba(31,18,31,.96))] px-4 py-3 text-white shadow-[0_16px_48px_rgba(255,45,120,.38)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(255,45,120,.5)] lg:bottom-5",
          open && "scale-95",
        )}
        aria-label="Abrir Musa AI"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-white/12">
          <Bot className="size-5" />
        </span>
        <span className="hidden flex-col items-start text-left sm:flex">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
            Musa AI
          </span>
          <span className="text-[13px] font-bold leading-none">Assistente premium</span>
        </span>
        <Sparkles className="size-4 opacity-80" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-[110] bg-black/35 backdrop-blur-sm transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed right-0 top-0 z-[115] flex h-full w-full max-w-[430px] flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(12,12,16,.99),rgba(18,16,24,.98))] text-white shadow-[0_30px_80px_rgba(0,0,0,.45)] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Musa AI"
      >
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">
                <Sparkles className="size-3.5" />
                Luanda, Angola
              </p>
              <h2 className="mt-3 text-2xl font-black">Musa AI</h2>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Descobre lojas, produtos e serviços dentro da plataforma.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex size-10 items-center justify-center rounded-full bg-white/8 text-white/75 transition hover:bg-white/14"
              aria-label="Fechar Musa AI"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[92%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-sm",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-white/8 text-white/90",
                )}
              >
                {message.content}
              </div>
            ))}
            {mutation.isPending && (
              <div className="flex items-center gap-2 rounded-[24px] bg-white/8 px-4 py-3 text-sm text-white/70">
                <Loader2 className="size-4 animate-spin" />A pensar...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-[24px] border border-white/10 bg-white/6 p-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              rows={3}
              placeholder="Pergunta algo sobre a MUSA..."
              className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[10px] font-medium text-white/42">
                Responde apenas dentro do contexto da plataforma.
              </span>
              <button
                onClick={sendMessage}
                disabled={mutation.isPending || !input.trim()}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[12px] font-bold text-primary-foreground shadow-[0_14px_30px_rgba(255,45,120,.35)] disabled:opacity-50"
              >
                <Send className="size-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
