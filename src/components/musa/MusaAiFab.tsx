import { useEffect, useRef, useState, type ComponentType } from "react";
import { Loader2, Send, X, Maximize, Minimize } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { musaAssistantFn } from "@/lib/musa-ai.functions";
import { cn } from "@/lib/utils";
import { getTasteProfile } from "@/lib/personalization";
import { useAuth } from "@/hooks/useAuth";
import { MusaAiLogo } from "./MusaAiLogo";
import { motion, AnimatePresence } from "framer-motion";

// Custom markdown components for rich styling
const MarkdownComponents = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-base font-bold mb-2 text-slate-800 dark:text-white/90">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-bold mb-2 text-slate-700 dark:text-white/80">{children}</h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-3 leading-relaxed text-slate-700 dark:text-white/90">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mb-3 ml-4 list-disc space-y-1 text-slate-700 dark:text-white/90">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mb-3 ml-4 list-decimal space-y-1 text-slate-700 dark:text-white/90">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-sm">{children}</li>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-slate-700 dark:text-white/90">{children}</em>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800 dark:text-white/90">{children}</code>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-2 border-slate-200 dark:border-white/10 pl-3 italic text-slate-600 dark:text-white/80 my-3">{children}</blockquote>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border border-slate-100 dark:border-white/10 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-slate-50 dark:bg-white/6">{children}</thead>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => (
    <tbody className="divide-y divide-slate-100 dark:divide-white/10">{children}</tbody>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="odd:bg-white/50 even:bg-transparent hover:bg-white/25 dark:odd:bg-slate-800 transition-colors">{children}</tr>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-white uppercase tracking-wider">{children}</th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="px-3 py-2 text-sm text-slate-700 dark:text-white/90">{children}</td>
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState("");
  const [MarkdownRenderer, setMarkdownRenderer] = useState<ComponentType<any> | null>(null);
  const [remarkGfmPlugin, setRemarkGfmPlugin] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou a assistente Musa AI. Ajudo-te a otimizar vendas, descobrir criadoras e gerir publicações na plataforma.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const tasteProfile = getTasteProfile();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;

    const preloadMarkdown = async () => {
      if (MarkdownRenderer) return;
      const [{ default: ReactMarkdown }, remarkGfmModule] = await Promise.all([
        import("react-markdown"),
        import("remark-gfm"),
      ]);

      if (cancelled) return;
      setMarkdownRenderer(() => ReactMarkdown);
      setRemarkGfmPlugin(() => remarkGfmModule.default);
    };

    if (open) {
      void preloadMarkdown();
      return () => {
        cancelled = true;
      };
    }

    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(() => {
        void preloadMarkdown();
      });
    } else {
      timeoutHandle = window.setTimeout(() => {
        void preloadMarkdown();
      }, 1500);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, [open, MarkdownRenderer]);

  // Lock background scroll when Drawer / Fullscreen is open
  useEffect(() => {
    const locked = open || isFullscreen;
    if (typeof document !== "undefined") {
      document.body.style.overflow = locked ? "hidden" : "";
    }
    return () => {
      if (typeof document !== "undefined") document.body.style.overflow = "";
    };
  }, [open, isFullscreen]);

  // compute dynamic classes for backdrop and drawer based on fullscreen
  const backdropClass = isFullscreen
    ? "fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
    : "fixed inset-0 z-[110] bg-black/35 backdrop-blur-sm";

  const drawerBaseClass = isFullscreen
    ? "fixed inset-0 w-full h-[100dvh] z-[9999] rounded-none"
    : "fixed right-0 top-0 z-[1000] w-[85vw] max-w-sm h-[100dvh] flex flex-col";

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
            transition={{ duration: 0.25 }}
            className={backdropClass}
            onClick={() => {
              setIsFullscreen(false);
              setOpen(false);
            }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className={`${drawerBaseClass} ${!isFullscreen ? 'rounded-l-3xl' : 'rounded-none'} bg-white/90 dark:bg-slate-900/80 text-slate-900 dark:text-white backdrop-blur-md shadow-2xl`}
            aria-label="Musa AI"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="px-4 py-4 border-b">
            <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D78] to-[#FF5BA3] shadow-[0_8px_24px_rgba(255,45,120,.3)]">
                <MusaAiLogo className="size-7" />
              </div>
              <div>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Musa AI</h2>
                <p className="mt-1 text-sm leading-tight text-slate-600 dark:text-white/80 font-light">Ajudo-te a otimizar vendas, descobrir criadoras e gerir publicações.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen((c) => !c)}
                className="flex size-10 items-center justify-center rounded-full bg-white/6 text-white/75 transition hover:bg-white/12"
                aria-label={isFullscreen ? "Minimizar" : "Tela cheia"}
                title={isFullscreen ? "Minimizar" : "Tela cheia"}
              >
                {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
              </button>
              <button
                onClick={() => {
                  setIsFullscreen(false);
                  setOpen(false);
                }}
                className="flex size-10 items-center justify-center rounded-full bg-white/8 text-white/75 transition hover:bg-white/14"
                aria-label="Fechar Musa AI"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 pb-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={`${message.role}-${index}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "max-w-[90%] rounded-[28px] px-5 py-4 text-[14px] leading-relaxed shadow-sm font-light",
                  message.role === "user"
                    ? "ml-auto bg-gradient-to-br from-[#FF2D78] to-[#FF5BA3] text-white"
                    : "bg-white/80 text-slate-900 dark:bg-slate-800/70 dark:text-white border border-slate-100 dark:border-white/10",
                )}
              >
                {message.role === "assistant" ? (
                  MarkdownRenderer ? (
                    <MarkdownRenderer
                      remarkPlugins={remarkGfmPlugin ? [remarkGfmPlugin] : []}
                      components={MarkdownComponents}
                    >
                      {message.content}
                    </MarkdownRenderer>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-white/90">
                      {message.content}
                    </p>
                  )
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

        <div className="border-t border-white/10 p-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
              className="w-full resize-none bg-transparent text-[14px] text-slate-900 dark:text-white outline-none placeholder:text-slate-500 dark:placeholder:text-white/35 font-light leading-relaxed"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
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
