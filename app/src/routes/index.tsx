import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Search, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/musa/ProductCard";
import { useFavorites } from "@/hooks/useFavorites";
import { categories, items } from "@/lib/musa-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MUSA — Mercado de beleza e moda em Luanda" },
      {
        name: "description",
        content:
          "Descobre produtos e serviços de beleza e moda de criadoras angolanas. Compra directo por WhatsApp em Kwanzas.",
      },
      {
        property: "og:title",
        content: "MUSA — Mercado de beleza e moda em Luanda",
      },
      {
        property: "og:description",
        content:
          "Produtos e serviços de beleza e moda de criadoras angolanas, com compra directa por WhatsApp.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [active, setActive] = useState<string>("Tudo");
  const [query, setQuery] = useState("");
  const { isFavorite, toggle } = useFavorites();

  const visible = useMemo(
    () =>
      items.filter(
        (i) =>
          (active === "Tudo" || i.category === active) &&
          (query.trim() === "" ||
            `${i.title} ${i.storeName}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [active, query],
  );

  return (
    <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Luanda · Angola
          </p>
          <h1 className="display truncate text-3xl leading-tight">MUSA</h1>
        </div>
        <button
          type="button"
          aria-label="Notificações"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border-soft bg-card"
        >
          <span className="relative">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
          </span>
        </button>
      </header>

      <label className="mt-4 flex min-h-[44px] items-center gap-2 rounded-full border border-border-soft bg-card px-4 shadow-soft">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Procurar batom, tranças, capulana…"
          className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <Link
        to="/reels"
        className="ink-panel mt-4 flex items-center gap-3 p-4 transition-transform active:scale-[0.99]"
      >
        <span className="flex h-11 w-11 shrink-0 animate-musa-float items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-neon">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold">Reels MUSA</span>
          <span className="block truncate text-xs opacity-70">
            Vê, gosta e compra em segundos
          </span>
        </span>
      </Link>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={cn(
              "min-h-[44px] shrink-0 rounded-full border px-4 text-xs font-semibold transition-colors",
              active === c
                ? "border-primary bg-primary text-primary-foreground shadow-neon"
                : "border-border-soft bg-card text-muted-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <h2 className="mt-5 text-sm font-bold">
        Em destaque{" "}
        <span className="font-normal text-muted-foreground">
          ({visible.length})
        </span>
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-3 pb-6">
        {visible.map((item, i) => (
          <ProductCard
            key={item.id}
            item={item}
            index={i}
            favorite={isFavorite(item.id)}
            onToggleFavorite={toggle}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center text-sm text-muted-foreground"
        >
          Sem resultados. Tenta outra categoria.
        </motion.p>
      )}
    </main>
  );
}
