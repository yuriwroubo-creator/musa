import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Search,
  Send,
  ShoppingBag,
  Music2,
} from "lucide-react";
import { reels, formatKz, whatsappLink } from "@/lib/musa-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "Reels MUSA — beleza e moda em vídeo" },
      {
        name: "description",
        content:
          "Feed vertical de reels das criadoras MUSA em Luanda: vê, gosta e compra por WhatsApp.",
      },
      { property: "og:title", content: "Reels MUSA — beleza e moda em vídeo" },
      {
        property: "og:description",
        content:
          "Feed vertical das criadoras MUSA: descobre produtos e serviços e compra por WhatsApp.",
      },
    ],
  }),
  component: ReelsFeed,
});

function ReelsFeed() {
  const [liked, setLiked] = useState<string[]>([]);

  const toggleLike = (id: string) => {
    setLiked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(14);
  };

  const share = async (title: string) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "MUSA", text: title });
      } catch {
        /* cancelado */
      }
    }
  };

  return (
    <div className="fixed inset-0 z-10 bg-black">
      <div className="absolute inset-x-0 top-0 z-30 flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <label className="flex w-full max-w-md min-h-[44px] items-center gap-2 rounded-full bg-black/40 px-4 backdrop-blur-md">
          <Search className="h-4 w-4 shrink-0 text-white/70" />
          <input
            placeholder="Procurar reels, criadoras…"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/60"
          />
        </label>
      </div>

      <div className="no-scrollbar h-[calc(100dvh-76px)] snap-y snap-mandatory overflow-y-scroll">
        {reels.map((reel) => {
          const isLiked = liked.includes(reel.id);
          return (
            <section
              key={reel.id}
              className="relative h-[calc(100dvh-76px)] w-full snap-start overflow-hidden"
            >
              <img
                src={reel.image}
                alt={reel.caption}
                loading="lazy"
                width={576}
                height={1024}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

              <div className="absolute bottom-4 right-3 z-20 flex flex-col items-center gap-4">
                <button
                  type="button"
                  aria-label="Gostar"
                  onClick={() => toggleLike(reel.id)}
                  className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1"
                >
                  <motion.span
                    whileTap={{ scale: 0.8 }}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                  >
                    <Heart
                      className={cn("h-6 w-6 text-white")}
                      style={isLiked ? { fill: "#FF5BA3", color: "#FF5BA3" } : undefined}
                    />
                  </motion.span>
                  <span className="text-[11px] font-semibold text-white">
                    {(reel.likes + (isLiked ? 1 : 0)).toLocaleString("pt-PT")}
                  </span>
                </button>

                <button
                  type="button"
                  aria-label="Comentários"
                  className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </span>
                  <span className="text-[11px] font-semibold text-white">
                    {reel.comments}
                  </span>
                </button>

                <button
                  type="button"
                  aria-label="Partilhar"
                  onClick={() => share(reel.itemTitle)}
                  className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <Send className="h-5 w-5 text-white" />
                  </span>
                  <span className="text-[11px] font-semibold text-white">
                    Enviar
                  </span>
                </button>

                <a
                  href={whatsappLink(
                    reel.whatsapp,
                    `Olá ${reel.storeName}, vi o vosso reel na MUSA e quero saber mais sobre "${reel.itemTitle}".`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Falar por WhatsApp"
                  className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm"
                  style={{ backgroundColor: "rgba(37,211,102,0.8)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
                    <path d="M17.5 14.4c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.4-1.7-1.6-2-.1-.3 0-.4.1-.6.1-.1.4-.5.5-.7.1-.2.2-.3.1-.6 0-.2-.7-1.8-.9-2.4-.2-.6-.4-.5-.6-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1 2.9 1.2 3.1c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4 0-.1-.2-.2-.3-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.3c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
                  </svg>
                </a>
              </div>

              <div className="absolute bottom-4 left-0 z-20 max-w-[74%] space-y-2.5 px-4">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white backdrop-blur-sm">
                    {reel.storeName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-white">
                      {reel.storeName}
                    </span>
                    <span className="block truncate text-[11px] text-white/70">
                      {reel.handle}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="ml-1 min-h-[32px] shrink-0 rounded-full border border-white/60 px-3 text-[11px] font-bold text-white"
                  >
                    Seguir
                  </button>
                </div>

                <p className="line-clamp-2 text-[13px] leading-snug text-white/90">
                  {reel.caption}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-white/70">
                  <Music2 className="h-3.5 w-3.5" />
                  <span className="truncate">Som original · {reel.handle}</span>
                </div>

                <a
                  href={whatsappLink(
                    reel.whatsapp,
                    `Olá ${reel.storeName}, quero comprar "${reel.itemTitle}" (${formatKz(reel.price)}) que vi na MUSA.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-bold text-white"
                  style={{
                    background: "linear-gradient(90deg,#FF2D78,#FF5BA3)",
                    boxShadow: "0 10px 30px -12px rgba(255,45,120,0.7)",
                  }}
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {reel.itemTitle} · {formatKz(reel.price)}
                  </span>
                </a>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
