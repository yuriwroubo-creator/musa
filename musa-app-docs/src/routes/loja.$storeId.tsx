import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { ProductCard } from "@/components/musa/ProductCard";
import { useFavorites } from "@/hooks/useFavorites";
import { items, stores, whatsappLink } from "@/lib/musa-data";

export const Route = createFileRoute("/loja/$storeId")({
  loader: ({ params }) => {
    const store = stores.find((s) => s.id === params.storeId);
    if (!store) throw notFound();
    return { store };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Loja indisponível — MUSA" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { store } = loaderData;
    return {
      meta: [
        { title: `${store.name} — Loja MUSA` },
        { name: "description", content: store.bio },
        { property: "og:title", content: `${store.name} — Loja MUSA` },
        { property: "og:description", content: store.bio },
      ],
    };
  },
  component: StorePage,
});

function StorePage() {
  const { store } = Route.useLoaderData();
  const { isFavorite, toggle } = useFavorites();
  const storeItems = items.filter((i) => i.storeId === store.id);

  return (
    <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2">
        <Link
          to="/"
          aria-label="Voltar"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border-soft bg-card"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="display truncate text-2xl">{store.name}</h1>
      </div>

      <section className="luxe-card mt-4 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-wash text-lg font-bold text-primary">
            {store.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{store.handle}</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" /> Luanda ·{" "}
              {store.followers.toLocaleString("pt-PT")} seguidores
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3 fill-gold text-gold" /> 4.9 · resposta
              rápida
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{store.bio}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-neon"
          >
            Seguir
          </button>
          <a
            href={whatsappLink(
              storeItems[0]?.whatsapp ?? "244923000001",
              `Olá ${store.name}, encontrei a vossa loja na MUSA e quero saber mais.`,
            )}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground"
            style={{ backgroundColor: "#25D366" }}
          >
            WhatsApp
          </a>
        </div>
      </section>

      <h2 className="mt-5 text-sm font-bold">
        Catálogo{" "}
        <span className="font-normal text-muted-foreground">
          ({storeItems.length})
        </span>
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 pb-6">
        {storeItems.map((item, i) => (
          <ProductCard
            key={item.id}
            item={item}
            index={i}
            favorite={isFavorite(item.id)}
            onToggleFavorite={toggle}
          />
        ))}
      </div>
    </main>
  );
}
