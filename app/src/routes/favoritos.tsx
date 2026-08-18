import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartOff } from "lucide-react";
import { ProductCard } from "@/components/musa/ProductCard";
import { useFavorites } from "@/hooks/useFavorites";
import { items } from "@/lib/musa-data";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — MUSA" },
      {
        name: "description",
        content:
          "Os teus produtos e serviços guardados na MUSA, prontos para comprar por WhatsApp.",
      },
      { property: "og:title", content: "Favoritos — MUSA" },
      {
        property: "og:description",
        content: "Produtos e serviços guardados na MUSA.",
      },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { ids, isFavorite, toggle } = useFavorites();
  const favorites = items.filter((i) => ids.includes(i.id));

  return (
    <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="display text-3xl">Favoritos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {favorites.length} artigo{favorites.length === 1 ? "" : "s"} guardado
        {favorites.length === 1 ? "" : "s"}
      </p>

      {favorites.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 pb-6">
          {favorites.map((item, i) => (
            <ProductCard
              key={item.id}
              item={item}
              index={i}
              favorite={isFavorite(item.id)}
              onToggleFavorite={toggle}
            />
          ))}
        </div>
      ) : (
        <div className="luxe-card mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-wash text-primary">
            <HeartOff className="h-6 w-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            Ainda não guardaste nada. Toca no coração para guardar os teus
            artigos preferidos.
          </p>
          <Link
            to="/"
            className="flex min-h-[44px] items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-neon"
          >
            Explorar mercado
          </Link>
        </div>
      )}
    </main>
  );
}
