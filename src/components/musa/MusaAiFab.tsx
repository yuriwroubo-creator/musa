import { useEffect, useRef, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { musaAssistantFn } from "@/lib/musa-ai.functions";
import { cn } from "@/lib/utils";
import { getTasteProfile } from "@/lib/personalization";
import { useAuth } from "@/hooks/useAuth";
import { MusaAiLogo } from "./MusaAiLogo";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Custom markdown components for rich styling
const MarkdownComponents = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-lg font-bold mb-3 text-white">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-base font-bold mb-2 text-white/90">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-bold mb-2 text-white/80">{children}</h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-3 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mb-3 ml-4 list-disc space-y-1 text-white/90">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mb-3 ml-4 list-decimal space-y-1 text-white/90">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-sm">{children}</li>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-white/90">{children}</em>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-white/90">{children}</code>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-2 border-white/20 pl-3 italic text-white/70 my-3">{children}</blockquote>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border border-white/10 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-white/10">{children}</thead>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => (
    <tbody className="divide-y divide-white/10">{children}</tbody>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="hover:bg-white/5 transition-colors">{children}</tr>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">{children}</th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="px-3 py-2 text-sm text-white/90">{children}</td>
  ),
  a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
    <a 
      href={href} 
      className="text-[#FF5BA3] hover:text-[#FF2D78] underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

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
        "Olá! Sou a Musa AI, tua assistente premium da MUSA. Posso ajudar-te a descobrir produtos, serviços e criadoras, além de dar conselhos de negócio para melhorar as tuas vendas.",
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
        className="fixed bottom-[92px] right-4 z-[90] flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D78] to-[#FF5BA3] text-white shadow-[0_12px_32px_rgba(255,45,120,.4)] transition hover:shadow-[0_16px_40px_rgba(255,45,120,.6)] hover:scale-105 active:scale-95 lg:bottom-5"
        aria-label="Abrir assistente"
      >
        <MusaAiLogo className="size-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[110] bg-black/35 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-[115] flex w-[90vw] max-w-[380px] h-[60vh] max-h-[500px] flex-col rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,16,.99),rgba(18,16,24,.98))] text-white shadow-2xl"
            aria-label="Musa AI"
          >
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D78] to-[#FF5BA3] shadow-[0_8px_24px_rgba(255,45,120,.3)]">
                <MusaAiLogo className="size-7" />
              </div>
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">
                  Luanda, Angola
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">Musa AI</h2>
                <p className="mt-1 text-sm leading-relaxed text-white/70 font-light">
                  Sua assistente premium para negócios e descobertas na MUSA.
                </p>
              </div>
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

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={`${message.role}-${index}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                className={cn(
                  "max-w-[90%] rounded-[28px] px-5 py-4 text-[14px] leading-relaxed shadow-sm font-light",
                  message.role === "user"
                    ? "ml-auto bg-gradient-to-br from-[#FF2D78] to-[#FF5BA3] text-white"
                    : "bg-white/10 text-white/95 backdrop-blur-sm border border-white/5",
                )}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </motion.div>
            ))}
            {mutation.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-[28px] bg-white/10 px-5 py-4 text-sm text-white/70 backdrop-blur-sm border border-white/5"
              >
                <Loader2 className="size-4 animate-spin" />
                <span className="font-light">A pensar...</span>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
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
              placeholder="Pergunta algo sobre a MUSA, negócios ou melhoria de vendas..."
              className="w-full resize-none bg-transparent text-[14px] text-white outline-none placeholder:text-white/35 font-light leading-relaxed"
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[10px] font-light text-white/40">
                Assistente de negócios e descobertas
              </span>
              <button
                onClick={sendMessage}
                disabled={mutation.isPending || !input.trim()}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF2D78] to-[#FF5BA3] px-5 py-2.5 text-[12px] font-bold text-white shadow-[0_14px_30px_rgba(255,45,120,.35)] disabled:opacity-50 disabled:shadow-none transition-all hover:shadow-[0_16px_36px_rgba(255,45,120,.45)]"
              >
                <Send className="size-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
